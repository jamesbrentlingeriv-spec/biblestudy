// Audio Recording Functionality
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.animationId = null;
    this.startTime = null;
    this.timerInterval = null;
    this.lastDuration = "00:00";

    this.recordings = [];
    this.db = null;
    this.dbName = "BibleStudyDB";
    this.storeName = "recordings";

    this.init();
  }

  async init() {
    this.setupEventListeners();
    try {
      await this.initDatabase();
      await this.loadRecordingsFromDB();
    } catch (error) {
      console.error("Audio persistence unavailable:", error);
      app?.notesManager?.showToast(
        "Audio persistence is unavailable in this browser mode",
      );
    }
    this.renderRecordingsList();
  }

  setupEventListeners() {
    document
      .getElementById("recordBtn")
      .addEventListener("click", () => this.toggleRecording());
    document
      .getElementById("stopRecordingBtn")
      .addEventListener("click", () => this.stopRecording());
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("noteId", "noteId", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = () => {
        console.error("IndexedDB init error:", request.error);
        reject(request.error);
      };
    });
  }

  async loadRecordingsFromDB() {
    if (!this.db) return;

    const records = await this.getAllRecords();
    this.recordings = records.map((r) => ({
      ...r,
      url: URL.createObjectURL(r.blob),
    }));

    this.saveMetadataBackup();
  }

  getAllRecords() {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  putRecord(record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  deleteRecord(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async toggleRecording() {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      await this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  async startRecording() {
    try {
      if (app?.notesManager) app.notesManager.ensureCurrentNoteId();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.setupAudioContext(stream);

      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        await this.saveRecording();
        this.stopStream(stream);
      };

      this.mediaRecorder.start();
      this.startTime = Date.now();

      this.updateRecordingUI(true);
      this.startTimer();
      this.startVisualization();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Could not access microphone. Please ensure you have granted permission.",
      );
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.lastDuration = document.getElementById("recordingTimer").textContent;
      this.mediaRecorder.stop();
    }
    this.updateRecordingUI(false);
    this.stopTimer();
    this.stopVisualization();
  }

  setupAudioContext(stream) {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.canvas = document.getElementById("audioVisualizer");
    this.canvasCtx = this.canvas.getContext("2d");
  }

  startVisualization() {
    const draw = () => {
      if (!this.analyser) return;

      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(this.dataArray);

      const ctx = this.canvasCtx;
      const width = this.canvas.width;
      const height = this.canvas.height;

      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / this.dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < this.dataArray.length; i++) {
        barHeight = this.dataArray[i] / 2;

        ctx.fillStyle = "rgb(239, 68, 68)";
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  stopVisualization() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  startTimer() {
    const timerEl = document.getElementById("recordingTimer");
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsed % 60).toString().padStart(2, "0");
      timerEl.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    document.getElementById("recordingTimer").textContent = "00:00";
  }

  async saveRecording() {
    if (this.audioChunks.length === 0) return;

    const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
    const id = Date.now();
    const noteId = app.notesManager.getCurrentNoteId();

    const dbRecord = {
      id,
      noteId,
      timestamp: new Date().toISOString(),
      duration: this.lastDuration || "00:00",
      type: audioBlob.type,
      blob: audioBlob,
    };

    if (this.db) {
      try {
        await this.putRecord(dbRecord);
      } catch (error) {
        console.error("Failed to save recording:", error);
        app.notesManager.showToast("Failed to save recording");
        return;
      }
    }

    const recording = {
      ...dbRecord,
      url: URL.createObjectURL(audioBlob),
    };

    this.recordings.push(recording);
    this.saveMetadataBackup();
    this.renderRecordingsList();

    app.notesManager.showToast("Recording saved");
  }

  renderRecordingsList() {
    const container = document.getElementById("recordingsList");
    const currentNoteId = app.notesManager.getCurrentNoteId();

    const noteRecordings = this.recordings
      .filter((r) => r.noteId === currentNoteId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (noteRecordings.length === 0) {
      container.classList.add("hidden");
      return;
    }

    container.classList.remove("hidden");

    const listHtml = noteRecordings
      .map(
        (rec) => `
            <div class="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <button onclick="app.audioRecorder.playRecording(${rec.id})" class="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition-colors">
                        <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                    </button>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-medium text-slate-700 truncate">Recording ${rec.id.toString().slice(-4)}</div>
                        <div class="text-xs text-slate-500">${new Date(rec.timestamp).toLocaleString()} | ${rec.duration}</div>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <a href="${rec.url}" download="recording-${rec.id}.webm" class="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Download">
                        <i data-lucide="download" class="w-4 h-4"></i>
                    </a>
                    <button onclick="app.audioRecorder.deleteRecording(${rec.id})" class="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("");

    const header =
      '<h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sermon Recordings</h4>';
    container.innerHTML = header + listHtml;
    lucide.createIcons();
  }

  playRecording(id) {
    const recording = this.recordings.find((r) => r.id === id);
    if (!recording) return;

    const audio = new Audio(recording.url);
    audio.play();

    const btn = document.querySelector(
      `button[onclick="app.audioRecorder.playRecording(${id})"]`,
    );
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4"></i>';
      lucide.createIcons();
      btn.classList.add("bg-indigo-200");

      audio.onended = () => {
        btn.innerHTML = originalHTML;
        btn.classList.remove("bg-indigo-200");
        lucide.createIcons();
      };
    }
  }

  async deleteRecording(id) {
    if (!confirm("Delete this recording?")) return;

    const target = this.recordings.find((r) => r.id === id);
    if (!target) return;

    try {
      if (this.db) await this.deleteRecord(id);
    } catch (error) {
      console.error("Failed to delete recording:", error);
      return;
    }

    URL.revokeObjectURL(target.url);
    this.recordings = this.recordings.filter((r) => r.id !== id);
    this.saveMetadataBackup();
    this.renderRecordingsList();
  }

  async deleteRecordingsForNote(noteId) {
    const targets = this.recordings.filter((r) => r.noteId === noteId);
    if (targets.length === 0) return;

    if (this.db) {
      await Promise.all(
        targets.map((rec) => this.deleteRecord(rec.id).catch(() => null)),
      );
    }

    targets.forEach((rec) => URL.revokeObjectURL(rec.url));
    this.recordings = this.recordings.filter((r) => r.noteId !== noteId);
    this.saveMetadataBackup();
    this.renderRecordingsList();
  }

  stopStream(stream) {
    stream.getTracks().forEach((track) => track.stop());
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  saveMetadataBackup() {
    const metadata = this.recordings.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      duration: r.duration,
      noteId: r.noteId,
    }));
    localStorage.setItem("bibleStudyRecordings", JSON.stringify(metadata));
  }

  updateRecordingNoteId(oldId, newId) {
    this.recordings.forEach((r) => {
      if (r.noteId === oldId) r.noteId = newId;
    });
    this.renderRecordingsList();
  }

  updateRecordingUI(isRecording) {
    const btn = document.getElementById("recordBtn");
    const indicator = document.getElementById("recordingIndicator");
    const btnText = document.getElementById("recordBtnText");

    if (isRecording) {
      btn.classList.add("hidden");
      indicator.classList.remove("hidden");
      indicator.classList.add("recording-pulse");
    } else {
      btn.classList.remove("hidden");
      indicator.classList.add("hidden");
      indicator.classList.remove("recording-pulse");
      btnText.textContent = "Record Again";
    }
  }
}
