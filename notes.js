// Notes Management and Verse Detection
class NotesManager {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem("bibleStudyNotes")) || [];
    this.currentNoteId = null;
    this.currentSongs = [];
    this.referencedVerses = new Map(); // verseId -> verseData
    this.verseObserver = null;
    this.debounceTimer = null;
    this.versePattern = bibleData.getVersePattern();

    // File System Access API support
    this.directoryHandle = null;
    this.useFileSystem = false;
    this.notesFileName = "bible-study-notes.json";

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();

    // Check if we previously had file system access
    const useFS = localStorage.getItem("bibleStudyUseFileSystem");
    if (useFS === "true" && "showDirectoryPicker" in window) {
      // Try to restore directory handle (may require user interaction)
      // We'll wait for user to click the button to re-establish permission
      this.updateFolderUI();
    }

    this.renderNotesList();
    this.loadNote(this.getMostRecentNote()?.id);
  }

  setupEventListeners() {
    const noteContent = document.getElementById("noteContent");
    const noteTitle = document.getElementById("noteTitle");

    noteContent.addEventListener("input", () => {
      this.handleContentChange();
      this.showSaveStatus("Unsaved changes...");
    });

    noteTitle.addEventListener("input", () => {
      this.debounceSave();
      this.showSaveStatus("Unsaved changes...");
    });

    document.getElementById("saveNoteBtn").addEventListener("click", () => {
      this.saveCurrentNote();
      this.showSaveStatus("Saved");
    });

    document
      .getElementById("newNoteBtn")
      .addEventListener("click", () => this.createNewNote());
    document
      .getElementById("clearNotesBtn")
      .addEventListener("click", () => this.clearCurrentNote());
    document
      .getElementById("refreshVersesBtn")
      .addEventListener("click", () => this.scanForVerses());
    document
      .getElementById("copyVersesBtn")
      .addEventListener("click", () => this.copyAllVerses());
    document
      .getElementById("addSongBtn")
      .addEventListener("click", () => this.addSongFromInputs());

    const notesList = document.getElementById("notesList");
    if (notesList) {
      notesList.addEventListener("click", (e) => {
        const loadBtn = e.target.closest("[data-note-id]");
        if (loadBtn) {
          this.loadNote(parseInt(loadBtn.dataset.noteId, 10));
          return;
        }

        const deleteBtn = e.target.closest("[data-delete-note-id]");
        if (deleteBtn) {
          this.deleteNote(parseInt(deleteBtn.dataset.deleteNoteId, 10));
        }
      });
    }

    const songsList = document.getElementById("songsList");
    if (songsList) {
      songsList.addEventListener("click", (e) => {
        const insertBtn = e.target.closest("[data-insert-song-id]");
        if (insertBtn) {
          this.insertSongIntoNote(parseInt(insertBtn.dataset.insertSongId, 10));
          return;
        }

        const deleteBtn = e.target.closest("[data-delete-song-id]");
        if (deleteBtn) {
          this.deleteSong(parseInt(deleteBtn.dataset.deleteSongId, 10));
        }
      });
    }

    // File system save location button
    const fsBtn = document.getElementById("chooseFolderBtn");
    if (fsBtn) {
      fsBtn.addEventListener("click", () => this.chooseSaveFolder());
    }
  }

  setupIntersectionObserver() {
    // Watch for verse references entering viewport
    this.verseObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const verseId = entry.target.dataset.verseId;
            this.highlightSidebarVerse(verseId);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: "-20% 0px -20% 0px",
      },
    );
  }

  handleContentChange() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.scanForVerses();
      this.debounceSave();
    }, 800); // Wait for typing to pause
  }

  debounceSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveCurrentNote(), 1000);
  }

  scanForVerses() {
    const content = document.getElementById("noteContent").value;
    const matches = [...content.matchAll(this.versePattern)];

    // Normalize and deduplicate references
    const references = new Map();
    matches.forEach((match) => {
      const normalized = bibleData.normalizeReference(match);
      if (normalized) {
        references.set(normalized.display, normalized);
      }
    });

    // Fetch verses that aren't cached
    references.forEach((ref, key) => {
      if (!this.referencedVerses.has(key)) {
        this.fetchAndCacheVerse(ref);
      }
    });

    // Remove verses no longer referenced
    const currentRefs = Array.from(references.keys());
    this.referencedVerses.forEach((_, key) => {
      if (!currentRefs.includes(key)) {
        this.referencedVerses.delete(key);
      }
    });

    this.renderReferencedVerses();
    this.wrapVerseReferences(content);
  }

  async fetchAndCacheVerse(ref) {
    const translation = document.getElementById("translationSelect").value;
    const reference = `${ref.book} ${ref.chapter}:${ref.verse}${ref.endVerse !== ref.verse ? `-${ref.endVerse}` : ""}`;

    const data = await bibleData.fetchVerses(reference, translation);
    if (data) {
      this.referencedVerses.set(ref.display, {
        ...ref,
        text: data.text,
        verses: data.verses,
      });
      this.renderReferencedVerses();
    }
  }

  wrapVerseReferences(content) {
    // Create a display version with clickable verse spans
    // This is a simplified version - in production, you'd want to be more careful with regex replacement
    let html = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Replace verse references with spans
    const pattern = bibleData.getVersePattern();
    html = html.replace(pattern, (match) => {
      const normalized = bibleData.normalizeReference([
        match,
        ...match.match(new RegExp(pattern.source, "i")),
      ]);
      if (normalized) {
        return `<span class="verse-reference" data-verse-id="${normalized.display}" onclick="app.scrollToVerse('${normalized.display}')">${match}</span>`;
      }
      return match;
    });

    // Convert newlines to breaks for display
    html = html.replace(/\n/g, "<br>");

    // Store for scroll detection (we don't actually render this HTML in the textarea,
    // but we use it for preview mode or could use it for a split view)
    this.wrappedContent = html;
  }

  renderReferencedVerses() {
    const container = document.getElementById("versesContainer");

    if (this.referencedVerses.size === 0) {
      container.innerHTML = `
                <div class="text-center text-slate-400 py-8">
                    <i data-lucide="quote" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p class="text-sm">Verse references typed in your notes will appear here automatically</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = Array.from(this.referencedVerses.entries())
      .map(
        ([key, verse]) => `
            <div class="verse-card" data-verse-card="${key}" onclick="app.scrollToVerseInNotes('${key}')">
                <div class="verse-reference-text">
                    <i data-lucide="bookmark" class="w-3 h-3"></i>
                    ${key}
                    <span class="ml-auto text-xs text-slate-400 font-normal">${bibleData.translations[document.getElementById("translationSelect").value]}</span>
                </div>
                <div class="verse-content">${verse.text}</div>
            </div>
        `,
      )
      .join("");

    lucide.createIcons();
  }

  highlightSidebarVerse(verseId) {
    // Remove active class from all cards
    document.querySelectorAll(".verse-card").forEach((card) => {
      card.classList.remove("active");
    });

    // Add active class to current
    const card = document.querySelector(`[data-verse-card="${verseId}"]`);
    if (card) {
      card.classList.add("active");
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Also highlight in textarea (visual feedback)
    // This would require complex overlay logic, so we skip for now
  }

  scrollToVerseInNotes(verseId) {
    // Find in textarea and set cursor position
    const textarea = document.getElementById("noteContent");
    const content = textarea.value;
    const index = content.indexOf(verseId);

    if (index !== -1) {
      textarea.focus();
      textarea.setSelectionRange(index, index + verseId.length);
      // Highlight temporarily
      this.flashTextareaSelection();
    }
  }

  flashTextareaSelection() {
    const textarea = document.getElementById("noteContent");
    textarea.classList.add("bg-yellow-50");
    setTimeout(() => textarea.classList.remove("bg-yellow-50"), 500);
  }

  createNewNote() {
    this.saveCurrentNote();
    this.currentNoteId = Date.now();
    this.currentSongs = [];
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
    const songTitle = document.getElementById("songTitleInput");
    const songLyrics = document.getElementById("songLyricsInput");
    if (songTitle) songTitle.value = "";
    if (songLyrics) songLyrics.value = "";
    this.referencedVerses.clear();
    this.renderReferencedVerses();
    this.renderNotesList();
    this.renderSongsList();
    if (window.app?.audioRecorder) app.audioRecorder.renderRecordingsList();
    this.showToast("New note created");
  }

  async chooseSaveFolder() {
    try {
      // Check if File System Access API is supported
      if (!("showDirectoryPicker" in window)) {
        // Fallback: Save as downloadable file
        this.showToast(
          "File System Access not supported. Using download fallback.",
        );
        this.exportToFile();
        return;
      }

      // Request directory picker
      this.directoryHandle = await window.showDirectoryPicker();
      this.useFileSystem = true;

      // Store preference
      localStorage.setItem("bibleStudyUseFileSystem", "true");

      // Try to load existing notes from the folder
      await this.loadNotesFromDirectory();

      this.showToast(`Save location set: ${this.directoryHandle.name}`);
      this.updateFolderUI();
    } catch (error) {
      if (error.name === "AbortError") {
        // User cancelled
        return;
      }
      console.error("Error choosing folder:", error);
      this.showToast("Error accessing folder. Using local storage instead.");
      this.useFileSystem = false;
    }
  }

  async loadNotesFromDirectory() {
    if (!this.directoryHandle) return;

    try {
      // Try to find existing notes file
      const fileHandle = await this.directoryHandle.getFileHandle(
        this.notesFileName,
      );
      const file = await fileHandle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.notes && Array.isArray(data.notes)) {
        this.notes = data.notes;
        // Load the most recent note
        if (this.notes.length > 0) {
          this.loadNote(this.getMostRecentNote()?.id);
        }
        this.showToast(`Loaded ${this.notes.length} notes from folder`);
      }
    } catch (error) {
      // File doesn't exist yet, that's fine
      console.log("No existing notes file found in directory");
    }
  }

  async saveNotesToDirectory() {
    if (!this.directoryHandle || !this.useFileSystem) return false;

    try {
      // Create or get the file handle
      const fileHandle = await this.directoryHandle.getFileHandle(
        this.notesFileName,
        { create: true },
      );

      // Create writable stream
      const writable = await fileHandle.createWritable();

      // Prepare data
      const data = {
        app: "Bible Study Suite",
        version: "1.0",
        lastModified: new Date().toISOString(),
        notes: this.notes,
      };

      // Write data
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      return true;
    } catch (error) {
      console.error("Error saving to directory:", error);
      return false;
    }
  }

  exportToFile() {
    // Fallback: Create downloadable JSON file
    const data = {
      app: "Bible Study Suite",
      version: "1.0",
      exported: new Date().toISOString(),
      notes: this.notes,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bible-study-notes-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast("Notes exported as file");
  }

  updateFolderUI() {
    const btn = document.getElementById("chooseFolderBtn");
    const status = document.getElementById("folderStatus");

    if (this.useFileSystem && this.directoryHandle) {
      if (btn) {
        btn.innerHTML = `<i data-lucide="folder-check" class="w-4 h-4"></i> ${this.directoryHandle.name}`;
        btn.classList.add("bg-green-50", "text-green-700", "border-green-200");
        btn.classList.remove(
          "bg-slate-50",
          "text-slate-600",
          "border-slate-200",
        );
      }
      if (status) {
        status.textContent = "Auto-saving to folder";
        status.classList.remove("hidden");
      }
    } else {
      if (btn) {
        btn.innerHTML = `<i data-lucide="folder" class="w-4 h-4"></i> Choose Folder`;
        btn.classList.remove(
          "bg-green-50",
          "text-green-700",
          "border-green-200",
        );
        btn.classList.add("bg-slate-50", "text-slate-600", "border-slate-200");
      }
    }

    if (window.lucide) lucide.createIcons();
  }

  saveCurrentNote() {
    const rawTitle = document.getElementById("noteTitle").value;
    const content = document.getElementById("noteContent").value;

    if (!content.trim() && !rawTitle.trim()) return;

    const title = rawTitle.trim() || "Untitled Note";

    if (!this.currentNoteId) {
      this.currentNoteId = Date.now();
    }

    const note = {
      id: this.currentNoteId,
      title,
      content,
      songs: this.currentSongs,
      references: Array.from(this.referencedVerses.keys()),
      timestamp: new Date().toISOString(),
      translation: document.getElementById("translationSelect").value,
    };

    // Update or add to array
    const existingIndex = this.notes.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      this.notes[existingIndex] = note;
    } else {
      this.notes.push(note);
    }

    // Always save to localStorage as backup
    localStorage.setItem("bibleStudyNotes", JSON.stringify(this.notes));

    // If using file system, save there too
    if (this.useFileSystem && this.directoryHandle) {
      this.saveNotesToDirectory().then((success) => {
        if (success) {
          this.showSaveStatus("Saved to folder");
        } else {
          this.showSaveStatus("Saved (local backup)");
        }
      });
    } else {
      this.showSaveStatus("Saved");
    }

    this.renderNotesList();
  }

  loadNote(id) {
    if (!id) return;
    const note = this.notes.find((n) => n.id === id);
    if (note) {
      this.currentNoteId = note.id;
      document.getElementById("noteTitle").value = note.title;
      document.getElementById("noteContent").value = note.content;
      document.getElementById("translationSelect").value =
        note.translation || "kjv";
      this.currentSongs = Array.isArray(note.songs) ? note.songs : [];
      this.scanForVerses();
      this.renderNotesList();
      this.renderSongsList();
      if (window.app?.audioRecorder) app.audioRecorder.renderRecordingsList();
    }
  }

  getMostRecentNote() {
    if (this.notes.length === 0) return null;
    return this.notes.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    )[0];
  }

  clearCurrentNote() {
    if (
      confirm(
        "Are you sure you want to clear the current note? This cannot be undone.",
      )
    ) {
      document.getElementById("noteTitle").value = "";
      document.getElementById("noteContent").value = "";
      this.currentSongs = [];
      this.renderSongsList();
      this.referencedVerses.clear();
      this.renderReferencedVerses();
      this.saveCurrentNote();
      this.showToast("Note cleared");
    }
  }

  deleteNote(id) {
    if (!id) return;
    if (!confirm("Delete this note and its recordings?")) return;

    this.notes = this.notes.filter((n) => n.id !== id);
    localStorage.setItem("bibleStudyNotes", JSON.stringify(this.notes));

    if (window.app?.audioRecorder) {
      app.audioRecorder.deleteRecordingsForNote(id);
    }

    if (this.currentNoteId === id) {
      const next = this.getMostRecentNote();
      if (next) {
        this.loadNote(next.id);
      } else {
        this.currentNoteId = Date.now();
        document.getElementById("noteTitle").value = "";
        document.getElementById("noteContent").value = "";
        this.referencedVerses.clear();
        this.renderReferencedVerses();
      }
    }

    this.renderNotesList();
    this.showToast("Note deleted");
  }

  ensureCurrentNoteId() {
    if (!this.currentNoteId) {
      this.currentNoteId = Date.now();
    }
    return this.currentNoteId;
  }

  renderNotesList() {
    const container = document.getElementById("notesList");
    if (!container) return;

    const sorted = [...this.notes].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );

    if (sorted.length === 0) {
      container.innerHTML =
        '<div class="text-xs text-slate-400">Your saved notes will appear here</div>';
      return;
    }

    container.innerHTML = sorted
      .map((note) => {
        const active = note.id === this.currentNoteId;
        const safeTitle = note.title || "Untitled Note";
        const preview = (note.content || "").replace(/\s+/g, " ").trim();
        return `
          <div class="note-item ${active ? "active" : ""}">
            <button class="note-load" data-note-id="${note.id}" title="Open note">
              <div class="note-title">${safeTitle}</div>
              <div class="note-meta">${new Date(note.timestamp).toLocaleString()}</div>
              <div class="note-preview">${preview || "No content yet"}</div>
            </button>
            <button class="note-delete" data-delete-note-id="${note.id}" title="Delete note">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  addSongFromInputs() {
    const titleEl = document.getElementById("songTitleInput");
    const lyricsEl = document.getElementById("songLyricsInput");
    if (!titleEl || !lyricsEl) return;

    const title = titleEl.value.trim();
    const lyrics = lyricsEl.value.trim();

    if (!title) {
      this.showToast("Song title is required");
      return;
    }
    if (!lyrics) {
      this.showToast("Song lyrics are required");
      return;
    }

    this.ensureCurrentNoteId();
    this.currentSongs.push({
      id: Date.now(),
      title,
      lyrics,
      createdAt: new Date().toISOString(),
    });

    titleEl.value = "";
    lyricsEl.value = "";
    this.renderSongsList();
    this.saveCurrentNote();
    this.showToast("Song saved to current study");
  }

  renderSongsList() {
    const container = document.getElementById("songsList");
    if (!container) return;

    const songs = Array.isArray(this.currentSongs) ? this.currentSongs : [];
    if (songs.length === 0) {
      container.innerHTML =
        '<div class="text-xs text-slate-400">Songs you add will appear here</div>';
      return;
    }

    container.innerHTML = songs
      .slice()
      .reverse()
      .map((song) => {
        const lyricsPreview = song.lyrics.replace(/\s+/g, " ").trim();
        return `
          <div class="song-item">
            <div class="song-item-header">
              <div class="song-item-title">${song.title}</div>
              <button class="song-item-delete" data-delete-song-id="${song.id}" title="Delete song">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="song-item-preview">${lyricsPreview}</div>
            <button class="song-item-insert" data-insert-song-id="${song.id}">
              Insert Into Note
            </button>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  insertSongIntoNote(songId) {
    const song = this.currentSongs.find((s) => s.id === songId);
    if (!song) return;

    const textarea = document.getElementById("noteContent");
    if (!textarea) return;

    const block = `\n\n[Song] ${song.title}\n${song.lyrics}\n`;
    const before = textarea.value.substring(0, textarea.selectionStart);
    const after = textarea.value.substring(textarea.selectionStart);
    textarea.value = before + block + after;
    textarea.dispatchEvent(new Event("input"));
    textarea.focus();
    this.showToast("Song inserted into note");
  }

  deleteSong(songId) {
    const before = this.currentSongs.length;
    this.currentSongs = this.currentSongs.filter((s) => s.id !== songId);
    if (this.currentSongs.length === before) return;
    this.renderSongsList();
    this.saveCurrentNote();
    this.showToast("Song removed");
  }

  async exportIndividualFiles() {
    if (!this.directoryHandle) {
      this.showToast("Please choose a folder first");
      return;
    }

    // Export each note as individual markdown files
    for (const note of this.notes) {
      try {
        const fileName = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${note.id}.md`;
        const fileHandle = await this.directoryHandle.getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();

        const content = `# ${note.title}\n\n*Created: ${new Date(note.timestamp).toLocaleString()}*\n*Translation: ${note.translation}*\n\n${note.content}\n\n## Referenced Verses\n\n${note.references?.join("\n") || "None"}`;

        await writable.write(content);
        await writable.close();
      } catch (error) {
        console.error("Error exporting note:", error);
      }
    }

    this.showToast(`Exported ${this.notes.length} notes as Markdown`);
  }

  copyAllVerses() {
    const verses = Array.from(this.referencedVerses.values())
      .map((v) => `${v.display} - ${v.text}`)
      .join("\n\n");

    navigator.clipboard.writeText(verses).then(() => {
      this.showToast("All verses copied to clipboard");
    });
  }

  showSaveStatus(message) {
    const status = document.getElementById("saveStatus");
    status.textContent = message;
    status.classList.remove("hidden");
    if (message === "Saved") {
      setTimeout(() => status.classList.add("hidden"), 2000);
    }
  }

  showToast(message) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMessage").textContent = message;
    toast.classList.add("toast-show");
    setTimeout(() => toast.classList.remove("toast-show"), 3000);
  }

  getCurrentNoteId() {
    return this.currentNoteId;
  }

  updateTranslation(translation) {
    // Re-fetch all verses with new translation
    this.referencedVerses.clear();
    this.scanForVerses();
  }
}
