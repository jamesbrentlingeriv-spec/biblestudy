// Bible Data and API Integration
const bibleData = {
  books: [
    // Old Testament
    { name: "Genesis", chapters: 50, abbr: ["Gen", "Gn"] },
    { name: "Exodus", chapters: 40, abbr: ["Exod", "Ex", "Exo"] },
    { name: "Leviticus", chapters: 27, abbr: ["Lev", "Lv"] },
    { name: "Numbers", chapters: 36, abbr: ["Num", "Nm", "Nu"] },
    { name: "Deuteronomy", chapters: 34, abbr: ["Deut", "Dt", "Deu"] },
    { name: "Joshua", chapters: 24, abbr: ["Josh", "Jos"] },
    { name: "Judges", chapters: 21, abbr: ["Judg", "Jdg", "Jg"] },
    { name: "Ruth", chapters: 4, abbr: ["Ruth", "Rut", "Ru"] },
    { name: "1 Samuel", chapters: 31, abbr: ["1 Sam", "1 Sm", "1 Sa"] },
    { name: "2 Samuel", chapters: 24, abbr: ["2 Sam", "2 Sm", "2 Sa"] },
    { name: "1 Kings", chapters: 22, abbr: ["1 Kgs", "1 Ki", "1 King"] },
    { name: "2 Kings", chapters: 25, abbr: ["2 Kgs", "2 Ki", "2 King"] },
    { name: "1 Chronicles", chapters: 29, abbr: ["1 Chr", "1 Ch", "1 Chron"] },
    { name: "2 Chronicles", chapters: 36, abbr: ["2 Chr", "2 Ch", "2 Chron"] },
    { name: "Ezra", chapters: 10, abbr: ["Ezra", "Ezr"] },
    { name: "Nehemiah", chapters: 13, abbr: ["Neh", "Ne"] },
    { name: "Esther", chapters: 10, abbr: ["Esth", "Est", "Es"] },
    { name: "Job", chapters: 42, abbr: ["Job", "Jb"] },
    { name: "Psalms", chapters: 150, abbr: ["Ps", "Psa", "Psalm", "Pss"] },
    { name: "Proverbs", chapters: 31, abbr: ["Prov", "Pr", "Pro"] },
    { name: "Ecclesiastes", chapters: 12, abbr: ["Eccl", "Ecc", "Ec"] },
    {
      name: "Song of Solomon",
      chapters: 8,
      abbr: ["Song", "So", "Canticles", "Cant"],
    },
    { name: "Isaiah", chapters: 66, abbr: ["Isa", "Is"] },
    { name: "Jeremiah", chapters: 52, abbr: ["Jer", "Je", "Jr"] },
    { name: "Lamentations", chapters: 5, abbr: ["Lam", "La"] },
    { name: "Ezekiel", chapters: 48, abbr: ["Ezek", "Eze", "Ezk"] },
    { name: "Daniel", chapters: 12, abbr: ["Dan", "Da", "Dn"] },
    { name: "Hosea", chapters: 14, abbr: ["Hos", "Ho"] },
    { name: "Joel", chapters: 3, abbr: ["Joel", "Joe", "Jl"] },
    { name: "Amos", chapters: 9, abbr: ["Amos", "Amo", "Am"] },
    { name: "Obadiah", chapters: 1, abbr: ["Obad", "Ob", "Oba"] },
    { name: "Jonah", chapters: 4, abbr: ["Jonah", "Jon", "Jnh"] },
    { name: "Micah", chapters: 7, abbr: ["Mic", "Mc"] },
    { name: "Nahum", chapters: 3, abbr: ["Nah", "Na"] },
    { name: "Habakkuk", chapters: 3, abbr: ["Hab", "Hb"] },
    { name: "Zephaniah", chapters: 3, abbr: ["Zeph", "Zep", "Zp"] },
    { name: "Haggai", chapters: 2, abbr: ["Hag", "Hg"] },
    { name: "Zechariah", chapters: 14, abbr: ["Zech", "Zec", "Zc"] },
    { name: "Malachi", chapters: 4, abbr: ["Mal", "Ml"] },
    // New Testament
    { name: "Matthew", chapters: 28, abbr: ["Matt", "Mat", "Mt"] },
    { name: "Mark", chapters: 16, abbr: ["Mark", "Mk", "Mr", "Mrk"] },
    { name: "Luke", chapters: 24, abbr: ["Luke", "Lk", "Luk", "Lu"] },
    { name: "John", chapters: 21, abbr: ["John", "Jn", "Jhn", "Joh"] },
    { name: "Acts", chapters: 28, abbr: ["Acts", "Ac", "Act"] },
    { name: "Romans", chapters: 16, abbr: ["Rom", "Ro", "Rm"] },
    { name: "1 Corinthians", chapters: 16, abbr: ["1 Cor", "1 Co", "1Cor"] },
    { name: "2 Corinthians", chapters: 13, abbr: ["2 Cor", "2 Co", "2Cor"] },
    { name: "Galatians", chapters: 6, abbr: ["Gal", "Ga"] },
    { name: "Ephesians", chapters: 6, abbr: ["Eph", "Ephes"] },
    { name: "Philippians", chapters: 4, abbr: ["Phil", "Php", "Ph", "Pp"] },
    { name: "Colossians", chapters: 4, abbr: ["Col", "Co"] },
    {
      name: "1 Thessalonians",
      chapters: 5,
      abbr: ["1 Thess", "1 Thes", "1 Th", "1Thess"],
    },
    {
      name: "2 Thessalonians",
      chapters: 3,
      abbr: ["2 Thess", "2 Thes", "2 Th", "2Thess"],
    },
    { name: "1 Timothy", chapters: 6, abbr: ["1 Tim", "1 Ti", "1Tm"] },
    { name: "2 Timothy", chapters: 4, abbr: ["2 Tim", "2 Ti", "2Tm"] },
    { name: "Titus", chapters: 3, abbr: ["Titus", "Tit", "Ti"] },
    { name: "Philemon", chapters: 1, abbr: ["Philem", "Phm", "Pm"] },
    { name: "Hebrews", chapters: 13, abbr: ["Heb", "Hebrew", "Hb"] },
    { name: "James", chapters: 5, abbr: ["Jas", "Jam", "Jm", "Jms"] },
    { name: "1 Peter", chapters: 5, abbr: ["1 Pet", "1 Pe", "1 Pt", "1Peter"] },
    { name: "2 Peter", chapters: 3, abbr: ["2 Pet", "2 Pe", "2 Pt", "2Peter"] },
    {
      name: "1 John",
      chapters: 5,
      abbr: ["1 Jn", "1 John", "1Jn", "1Jo", "1Joh"],
    },
    {
      name: "2 John",
      chapters: 1,
      abbr: ["2 Jn", "2 John", "2Jn", "2Jo", "2Joh"],
    },
    {
      name: "3 John",
      chapters: 1,
      abbr: ["3 Jn", "3 John", "3Jn", "3Jo", "3Joh"],
    },
    { name: "Jude", chapters: 1, abbr: ["Jude", "Jud", "Jd"] },
    { name: "Revelation", chapters: 22, abbr: ["Rev", "Re", "Revel", "Rv"] },
  ],

  translations: {
    kjv: { name: "King James Version", testament: "both", api: "bible-api" },
    asv: {
      name: "American Standard Version",
      testament: "both",
      api: "bible-api",
    },
    web: { name: "World English Bible", testament: "both", api: "bible-api" },
    ylt: {
      name: "Young's Literal Translation",
      testament: "both",
      api: "bible-api",
    },
  },

  // API.Bible book abbreviation mapping
  apiBibleBookMap: {
    Genesis: "GEN",
    Exodus: "EXO",
    Leviticus: "LEV",
    Numbers: "NUM",
    Deuteronomy: "DEU",
    Joshua: "JOS",
    Judges: "JDG",
    Ruth: "RUT",
    "1 Samuel": "1SA",
    "2 Samuel": "2SA",
    "1 Kings": "1KI",
    "2 Kings": "2KI",
    "1 Chronicles": "1CH",
    "2 Chronicles": "2CH",
    Ezra: "EZR",
    Nehemiah: "NEH",
    Esther: "EST",
    Job: "JOB",
    Psalms: "PSA",
    Proverbs: "PRO",
    Ecclesiastes: "ECC",
    "Song of Solomon": "SNG",
    Isaiah: "ISA",
    Jeremiah: "JER",
    Lamentations: "LAM",
    Ezekiel: "EZK",
    Daniel: "DAN",
    Hosea: "HOS",
    Joel: "JOL",
    Amos: "AMO",
    Obadiah: "OBA",
    Jonah: "JON",
    Micah: "MIC",
    Nahum: "NAM",
    Habakkuk: "HAB",
    Zephaniah: "ZEP",
    Haggai: "HAG",
    Zechariah: "ZEC",
    Malachi: "MAL",
    Matthew: "MAT",
    Mark: "MRK",
    Luke: "LUK",
    John: "JHN",
    Acts: "ACT",
    Romans: "ROM",
    "1 Corinthians": "1CO",
    "2 Corinthians": "2CO",
    Galatians: "GAL",
    Ephesians: "EPH",
    Philippians: "PHP",
    Colossians: "COL",
    "1 Thessalonians": "1TH",
    "2 Thessalonians": "2TH",
    "1 Timothy": "1TI",
    "2 Timothy": "2TI",
    Titus: "TIT",
    Philemon: "PHM",
    Hebrews: "HEB",
    James: "JAS",
    "1 Peter": "1PE",
    "2 Peter": "2PE",
    "1 John": "1JN",
    "2 John": "2JN",
    "3 John": "3JN",
    Jude: "JUD",
    Revelation: "REV",
  },

  // Build regex pattern for verse detection
  getVersePattern() {
    const bookNames = this.books.flatMap((b) => [b.name, ...b.abbr]);
    bookNames.sort((a, b) => b.length - a.length);
    const bookPattern = bookNames.join("|");
    return new RegExp(
      `\\b(${bookPattern})\\s+(\\d+):(\\d+)(?:\\s*[-–,]\\s*(\\d+))?`,
      "gi",
    );
  },

  normalizeReference(match) {
    const [_, book, chapter, verse, endVerse] = match;
    const bookData = this.books.find(
      (b) =>
        b.name.toLowerCase() === book.toLowerCase() ||
        b.abbr.some((a) => a.toLowerCase() === book.toLowerCase()),
    );
    if (!bookData) return null;
    return {
      book: bookData.name,
      chapter: parseInt(chapter),
      verse: parseInt(verse),
      endVerse: endVerse ? parseInt(endVerse) : parseInt(verse),
      display: `${bookData.name} ${chapter}:${verse}${endVerse ? `-${endVerse}` : ""}`,
    };
  },

  async fetchVerses(reference, translation = "kjv") {
    try {
      const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${translation}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch verse");
      return await response.json();
    } catch (error) {
      console.error("Error fetching verse:", error);
      return null;
    }
  },

  async fetchChapter(book, chapter, translation = "kjv") {
    const trans = this.translations[translation];
    if (!trans) {
      console.error("Unknown translation:", translation);
      return null;
    }

    // Use API.Bible for Hebrew and Greek
    if (trans.api === "api-bible") {
      return await this.fetchFromApiBible(book, chapter, trans.bibleId);
    }

    // Default to bible-api.com
    try {
      const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${translation}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch chapter");
      return await response.json();
    } catch (error) {
      console.error("Error fetching chapter:", error);
      return null;
    }
  },

  // Fetch from API.Bible
  async fetchFromApiBible(book, chapter, bibleId) {
    try {
      const bookAbbr = this.apiBibleBookMap[book];
      if (!bookAbbr) {
        console.error("Book not found:", book);
        return null;
      }

      const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${bookAbbr}.${chapter}`;
      const response = await fetch(url, {
        headers: { "api-key": "2e785260e26f44c3a6932274a79f1596" },
      });

      if (!response.ok) {
        throw new Error(`API.Bible error: ${response.status}`);
      }

      const data = await response.json();
      return this.convertApiBibleResponse(data.data, book, chapter);
    } catch (error) {
      console.error("Error fetching from API.Bible:", error);
      return null;
    }
  },

  // Convert API.Bible response to local format
  convertApiBibleResponse(data, book, chapter) {
    if (!data || !data.content) {
      return { book_name: book, chapter: chapter, verses: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.content, "text/html");
    const versesMap = new Map();

    // Find all elements with data-verse-id
    const verseElements = doc.querySelectorAll("[data-verse-id]");

    verseElements.forEach((el) => {
      const verseId = el.getAttribute("data-verse-id"); // e.g. "GEN.1.1"
      const parts = verseId.split(".");
      if (parts.length < 3) return;

      const verseNum = parseInt(parts[2], 10);
      if (isNaN(verseNum)) return;

      // Clone to safely remove verse numbers
      const clone = el.cloneNode(true);
      const numbers = clone.querySelectorAll(".v, .label, .chapter-number");
      numbers.forEach((n) => n.remove());

      let text = clone.textContent
        .replace(/[\n\r\t]/g, " ")
        .replace(/\s+/g, " ");

      if (versesMap.has(verseNum)) {
        versesMap.set(verseNum, versesMap.get(verseNum) + text);
      } else {
        versesMap.set(verseNum, text);
      }
    });

    const verses = [];
    const sortedVerses = Array.from(versesMap.keys()).sort((a, b) => a - b);

    sortedVerses.forEach((vNum) => {
      verses.push({
        book_name: book,
        chapter: chapter,
        verse: vNum,
        text: versesMap.get(vNum).trim(),
      });
    });

    return { book_name: book, chapter: chapter, verses: verses };
  },

  // Get books available for a specific translation
  getBooksForTranslation(translation) {
    const trans = this.translations[translation];
    if (!trans || trans.testament === "both") return this.books;
    const oldTestamentCount = 39;
    if (trans.testament === "old")
      return this.books.slice(0, oldTestamentCount);
    if (trans.testament === "new") return this.books.slice(oldTestamentCount);
    return this.books;
  },

  // Check if a book is available
  isBookAvailable(bookName, translation) {
    const books = this.getBooksForTranslation(translation);
    return books.some((b) => b.name === bookName);
  },
};
