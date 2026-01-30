/**
 * Bible Books Data
 * 
 * Complete list of all 66 books of the Bible with metadata:
 * - name: Full book name as displayed in UI
 * - chapters: Total number of chapters in the book
 * - section: "OT" for Old Testament, "NT" for New Testament
 * 
 * Used for:
 * - Book/chapter navigation dropdowns
 * - Validating chapter numbers
 * - Organizing Bible tracker by testament
 * - Calculating reading progress
 */
export const bibleData = [
  // OLD TESTAMENT - 39 Books
  { name: "Genesis", chapters: 50, section: "OT" },
  { name: "Exodus", chapters: 40, section: "OT" },
  { name: "Leviticus", chapters: 27, section: "OT" },
  { name: "Numbers", chapters: 36, section: "OT" },
  { name: "Deuteronomy", chapters: 34, section: "OT" },
  { name: "Joshua", chapters: 24, section: "OT" },
  { name: "Judges", chapters: 21, section: "OT" },
  { name: "Ruth", chapters: 4, section: "OT" },
  { name: "1 Samuel", chapters: 31, section: "OT" },
  { name: "2 Samuel", chapters: 24, section: "OT" },
  { name: "1 Kings", chapters: 22, section: "OT" },
  { name: "2 Kings", chapters: 25, section: "OT" },
  { name: "1 Chronicles", chapters: 29, section: "OT" },
  { name: "2 Chronicles", chapters: 36, section: "OT" },
  { name: "Ezra", chapters: 10, section: "OT" },
  { name: "Nehemiah", chapters: 13, section: "OT" },
  { name: "Esther", chapters: 10, section: "OT" },
  { name: "Job", chapters: 42, section: "OT" },
  { name: "Psalms", chapters: 150, section: "OT" },
  { name: "Proverbs", chapters: 31, section: "OT" },
  { name: "Ecclesiastes", chapters: 12, section: "OT" },
  { name: "Song of Solomon", chapters: 8, section: "OT" },
  { name: "Isaiah", chapters: 66, section: "OT" },
  { name: "Jeremiah", chapters: 52, section: "OT" },
  { name: "Lamentations", chapters: 5, section: "OT" },
  { name: "Ezekiel", chapters: 48, section: "OT" },
  { name: "Daniel", chapters: 12, section: "OT" },
  { name: "Hosea", chapters: 14, section: "OT" },
  { name: "Joel", chapters: 3, section: "OT" },
  { name: "Amos", chapters: 9, section: "OT" },
  { name: "Obadiah", chapters: 1, section: "OT" },
  { name: "Jonah", chapters: 4, section: "OT" },
  { name: "Micah", chapters: 7, section: "OT" },
  { name: "Nahum", chapters: 3, section: "OT" },
  { name: "Habakkuk", chapters: 3, section: "OT" },
  { name: "Zephaniah", chapters: 3, section: "OT" },
  { name: "Haggai", chapters: 2, section: "OT" },
  { name: "Zechariah", chapters: 14, section: "OT" },
  { name: "Malachi", chapters: 4, section: "OT" },

  // NEW TESTAMENT - 27 Books
  { name: "Matthew", chapters: 28, section: "NT" },
  { name: "Mark", chapters: 16, section: "NT" },
  { name: "Luke", chapters: 24, section: "NT" },
  { name: "John", chapters: 21, section: "NT" },
  { name: "Acts", chapters: 28, section: "NT" },
  { name: "Romans", chapters: 16, section: "NT" },
  { name: "1 Corinthians", chapters: 16, section: "NT" },
  { name: "2 Corinthians", chapters: 13, section: "NT" },
  { name: "Galatians", chapters: 6, section: "NT" },
  { name: "Ephesians", chapters: 6, section: "NT" },
  { name: "Philippians", chapters: 4, section: "NT" },
  { name: "Colossians", chapters: 4, section: "NT" },
  { name: "1 Thessalonians", chapters: 5, section: "NT" },
  { name: "2 Thessalonians", chapters: 3, section: "NT" },
  { name: "1 Timothy", chapters: 6, section: "NT" },
  { name: "2 Timothy", chapters: 4, section: "NT" },
  { name: "Titus", chapters: 3, section: "NT" },
  { name: "Philemon", chapters: 1, section: "NT" },
  { name: "Hebrews", chapters: 13, section: "NT" },
  { name: "James", chapters: 5, section: "NT" },
  { name: "1 Peter", chapters: 5, section: "NT" },
  { name: "2 Peter", chapters: 3, section: "NT" },
  { name: "1 John", chapters: 5, section: "NT" },
  { name: "2 John", chapters: 1, section: "NT" },
  { name: "3 John", chapters: 1, section: "NT" },
  { name: "Jude", chapters: 1, section: "NT" },
  { name: "Revelation", chapters: 22, section: "NT" }
];