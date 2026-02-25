// Main Application Controller
class BibleStudyApp {
  constructor() {
    this.currentBook = "John";
    this.currentChapter = 3;
    this.currentTranslation = "kjv";
    this.notesManager = null;
    this.audioRecorder = null;

    // Set global reference early because other classes reference `app` during init.
    app = this;
    window.app = this;

    this.init();
  }

  init() {
    this.notesManager = new NotesManager();
    this.audioRecorder = new AudioRecorder();

    this.populateBookSelect();
    this.setupEventListeners();
    this.loadInitialChapter();

    lucide.createIcons();
    this.registerServiceWorker();
  }

  populateBookSelect() {
    const select = document.getElementById("bookSelect");
    if (!select || !bibleData.books) {
      console.error("Book select element or bibleData not found");
      return;
    }

    // Get books available for the current translation
    const availableBooks = bibleData.getBooksForTranslation(
      this.currentTranslation,
    );

    // Check if current book is available in this translation
    const currentBookAvailable = availableBooks.some(
      (b) => b.name === this.currentBook,
    );

    // If current book is not available, switch to the first available book
    if (!currentBookAvailable && availableBooks.length > 0) {
      this.currentBook = availableBooks[0].name;
      this.currentChapter = 1;
    }

    select.innerHTML = "";
    availableBooks.forEach((book) => {
      const option = document.createElement("option");
      option.value = book.name;
      option.textContent = book.name;
      if (book.name === this.currentBook) option.selected = true;
      select.appendChild(option);
    });

    this.updateChapterSelect();
  }

  updateChapterSelect() {
    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");

    if (!bookSelect || !chapterSelect) return;

    const book = bibleData.books.find((b) => b.name === bookSelect.value);

    if (!book) {
      console.error("Book not found:", bookSelect.value);
      return;
    }

    chapterSelect.innerHTML = "";
    for (let i = 1; i <= book.chapters; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      if (i === this.currentChapter) option.selected = true;
      chapterSelect.appendChild(option);
    }
  }

  setupEventListeners() {
    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");
    const prevChapter = document.getElementById("prevChapter");
    const nextChapter = document.getElementById("nextChapter");
    const translationSelect = document.getElementById("translationSelect");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const searchInput = document.getElementById("searchInput");
    const bibleContent = document.getElementById("bibleContent");

    if (bookSelect) {
      bookSelect.addEventListener("change", () => {
        this.currentBook = bookSelect.value;
        this.currentChapter = 1;
        this.updateChapterSelect();
        this.loadChapter();
      });
    }

    if (chapterSelect) {
      chapterSelect.addEventListener("change", () => {
        this.currentChapter = parseInt(chapterSelect.value, 10);
        this.loadChapter();
      });
    }

    if (prevChapter)
      prevChapter.addEventListener("click", () => this.navigateChapter(-1));
    if (nextChapter)
      nextChapter.addEventListener("click", () => this.navigateChapter(1));

    if (translationSelect) {
      translationSelect.addEventListener("change", (e) => {
        this.currentTranslation = e.target.value;
        this.notesManager.updateTranslation(this.currentTranslation);
        this.populateBookSelect();
        this.loadChapter();
      });
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => this.toggleMobileMenu());
    }

    if (searchInput) {
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchVerse(e.target.value);
        }
      });
    }

    if (bibleContent) {
      bibleContent.addEventListener("click", (e) => {
        const verse = e.target.closest(".bible-verse");
        if (verse) {
          this.insertVerseIntoNotes(verse.dataset.reference);
        }
      });
    }
  }

  async loadInitialChapter() {
    await this.loadChapter();
  }

  async loadChapter() {
    const content = document.getElementById("bibleContent");
    if (!content) return;

    content.innerHTML =
      '<div class="loading-shimmer w-3/4"></div><div class="loading-shimmer w-full"></div><div class="loading-shimmer w-5/6"></div>';

    const data = await bibleData.fetchChapter(
      this.currentBook,
      this.currentChapter,
      this.currentTranslation,
    );

    if (!data) {
      content.innerHTML =
        '<div class="text-center text-red-500 p-4">Failed to load chapter. Please try again.</div>';
      return;
    }

    this.renderChapter(data);
    const refEl = document.getElementById("currentReference");
    if (refEl) {
      refEl.textContent = `${this.currentBook} ${this.currentChapter}`;
    }
  }

  renderChapter(data) {
    const content = document.getElementById("bibleContent");
    if (!content) return;

    if (!data.verses || data.verses.length === 0) {
      content.innerHTML =
        '<div class="text-center text-slate-500">No verses found</div>';
      return;
    }

    const isHebrew = this.currentTranslation === "heb";
    const textClass = isHebrew
      ? "text-slate-800 text-xl font-serif"
      : "text-slate-800";
    const dirAttr = isHebrew ? 'dir="rtl" lang="he"' : "";

    content.innerHTML = data.verses
      .map(
        (verse) => `
            <div class="bible-verse group" data-reference="${verse.book_name} ${verse.chapter}:${verse.verse}" onclick="app.selectVerse(this)">
                <span class="verse-number">${verse.verse}</span>
                <span class="${textClass}" ${dirAttr}>${this.formatVerseText(verse)}</span>
                <button class="opacity-0 group-hover:opacity-100 ml-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-opacity" onclick="event.stopPropagation(); app.insertVerseIntoNotes('${verse.book_name} ${verse.chapter}:${verse.verse}')">
                    <i data-lucide="plus-circle" class="w-4 h-4 inline"></i> Add to notes
                </button>
            </div>
        `,
      )
      .join("");

    lucide.createIcons();
    content.scrollTop = 0;
  }

  formatVerseText(verse) {
    const rawText = verse?.text || "";
    const safeText = this.escapeHtml(rawText);

    if (!this.shouldUseRedLetter(verse?.book_name || this.currentBook)) {
      return safeText;
    }

    // Approximation: highlight quoted speech, which typically maps to Christ's words in red-letter passages.
    return safeText.replace(
      /"([^"]+)"/g,
      '<span class="text-red-600">"$1"</span>',
    );
  }

  shouldUseRedLetter(bookName) {
    const redLetterBooks = new Set([
      "Matthew",
      "Mark",
      "Luke",
      "John",
      "Acts",
      "Revelation",
    ]);
    return redLetterBooks.has(bookName);
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  selectVerse(element) {
    element.classList.toggle("selected");
  }

  insertVerseIntoNotes(reference) {
    const textarea = document.getElementById("noteContent");
    if (!textarea) return;

    const currentValue = textarea.value;
    const cursorPosition = textarea.selectionStart;

    const before = currentValue.substring(0, cursorPosition);
    const after = currentValue.substring(cursorPosition);

    const prefix =
      before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n")
        ? " "
        : "";
    const suffix = after.length > 0 && !after.startsWith(" ") ? " " : "";

    const newValue = before + prefix + reference + suffix + after;
    textarea.value = newValue;
    textarea.dispatchEvent(new Event("input"));
    textarea.focus();
  }

  navigateChapter(direction) {
    const currentBookIndex = bibleData.books.findIndex(
      (b) => b.name === this.currentBook,
    );
    if (currentBookIndex < 0) return;

    let nextBookIndex = currentBookIndex;
    let nextChapter = this.currentChapter + direction;

    if (nextChapter < 1) {
      if (currentBookIndex === 0) return;
      nextBookIndex = currentBookIndex - 1;
      nextChapter = bibleData.books[nextBookIndex].chapters;
    } else if (nextChapter > bibleData.books[currentBookIndex].chapters) {
      if (currentBookIndex === bibleData.books.length - 1) return;
      nextBookIndex = currentBookIndex + 1;
      nextChapter = 1;
    }

    this.currentBook = bibleData.books[nextBookIndex].name;
    this.currentChapter = nextChapter;

    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");
    if (bookSelect) bookSelect.value = this.currentBook;
    this.updateChapterSelect();
    if (chapterSelect) chapterSelect.value = String(this.currentChapter);

    this.loadChapter();
  }

  toggleMobileMenu() {
    const biblePanel = document.getElementById("biblePanel");
    const sidebar = document.getElementById("contextSidebar");
    const overlay = document.getElementById("mobileOverlay");
    if (!biblePanel || !sidebar || !overlay) return;

    const isOpen =
      biblePanel.classList.contains("panel-open-left") ||
      sidebar.classList.contains("panel-open-right");
    if (isOpen) {
      this.closeMobilePanels();
      return;
    }

    biblePanel.classList.add("panel-open-left");
    sidebar.classList.remove("panel-open-right");
    overlay.classList.remove("hidden");
  }

  closeMobilePanels() {
    const biblePanel = document.getElementById("biblePanel");
    const sidebar = document.getElementById("contextSidebar");
    const overlay = document.getElementById("mobileOverlay");
    if (!biblePanel || !sidebar || !overlay) return;

    biblePanel.classList.remove("panel-open-left");
    sidebar.classList.remove("panel-open-right");
    overlay.classList.add("hidden");
  }

  async searchVerse(query) {
    const text = (query || "").trim();
    if (!text) return;

    const match = [...text.matchAll(bibleData.getVersePattern())][0];
    if (!match) {
      this.notesManager.showToast("Enter a reference like John 3:16");
      return;
    }

    const ref = bibleData.normalizeReference(match);
    if (!ref) {
      this.notesManager.showToast("Could not parse that verse reference");
      return;
    }

    this.currentBook = ref.book;
    this.currentChapter = ref.chapter;

    const bookSelect = document.getElementById("bookSelect");
    const chapterSelect = document.getElementById("chapterSelect");
    if (bookSelect) bookSelect.value = this.currentBook;
    this.updateChapterSelect();
    if (chapterSelect) chapterSelect.value = String(this.currentChapter);

    await this.loadChapter();

    const selector = `.bible-verse[data-reference="${ref.book} ${ref.chapter}:${ref.verse}"]`;
    const verseElement = document.querySelector(selector);
    if (verseElement) {
      verseElement.scrollIntoView({ behavior: "smooth", block: "center" });
      verseElement.classList.add("selected");
      setTimeout(() => verseElement.classList.remove("selected"), 1200);
    }
  }

  scrollToVerse(reference) {
    this.notesManager.scrollToVerseInNotes(reference);
  }

  scrollToVerseInNotes(reference) {
    this.notesManager.scrollToVerseInNotes(reference);
  }

  registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol === "file:") return;

    const register = () => {
      navigator.serviceWorker.register("./sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
  }
}

var app;
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const appRoot = document.getElementById("appRoot");

  // Function to hide splash and initialize app
  const initializeApp = () => {
    try {
      if (splash) {
        splash.style.display = "none";
        splash.classList.add("hidden");
      }
      if (appRoot) {
        appRoot.classList.remove("hidden");
      }
      app = new BibleStudyApp();
    } catch (error) {
      console.error("Error initializing app:", error);
      // Still hide splash even if there's an error
      if (splash) {
        splash.style.display = "none";
        splash.classList.add("hidden");
      }
      if (appRoot) {
        appRoot.classList.remove("hidden");
      }
    }
  };

  // Initialize after a short delay to allow GIF to play
  setTimeout(initializeApp, 3000);
});
