// apps.js
class BibleStudyApp {
  // ... other methods ...

  renderChapter(chapterData) {
    // Assuming chapterData is an array, and each item might be null or an object.
    // Or, chapterData itself might be null.
    // The error points to line 227, inside a map function or similar.

    if (!chapterData) {
      console.error("renderChapter received null or undefined chapterData.");
      return; // Or handle this case appropriately
    }

    const renderedContent = chapterData
      .map((item) => {
        // Line 227 is likely within this map callback or similar iteration.
        // Let's assume 'item' is where the error occurs if it's null.
        if (item === null) {
          console.warn("Skipping null item in chapter data.", item);
          return ""; // Or handle null items gracefully
        }
        // If 'John 3:1' is a property you're trying to access directly on 'item',
        // ensure 'item' is not null.
        // Example: If item.data.verses is where 'John 3:1' is expected
        if (
          item &&
          item.data &&
          item.data.verses &&
          item.data.verses["John 3:1"]
        ) {
          return `<p>${item.data.verses["John 3:1"]}</p>`; // Example usage
        } else {
          console.warn(
            "Could not find 'John 3:1' in item or item structure is invalid.",
            item,
          );
          return "";
        }
      })
      .join("");

    // ... rest of the method ...
  }

  // ... other methods ...
}
