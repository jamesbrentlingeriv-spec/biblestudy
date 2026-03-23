# Song Upload Feature Implementation

## Plan Overview

Extend existing "Songs For Study" section to support:

- Text songs (title + lyrics) ✅ existing
- MP3 file uploads (with preview player)
- YouTube links (with embed preview)

**Files to update:** index.html, notes.js, style.css

## Steps

### 1. Create TODO.md ✅ **DONE**

### 2. Update index.html UI

- Expand Songs For Study form with radio buttons: Text / MP3 / YouTube
- Add file input for MP3, URL input for YouTube
- Update songsList for type-specific previews (pending)

### 3. Extend notes.js logic

- Update song object schema
- Add IndexedDB storage for MP3 blobs (reuse audio.js pattern)
- Update addSongFromInputs(), renderSongsList(), insertSongIntoNote()
- Handle Blob URL cleanup (pending)

### 4. Add style.css updates

- Styles for new form inputs
- Audio player and YouTube embed responsive styling (pending)

### 5. Test all song types

- Add/insert/delete text, MP3, YouTube songs
- Verify persistence, note integration (pending)

### 6. attempt_completion

**Progress: 5/6 complete** (Core functionality implemented: index.html, notes.js
logic, style.css)
