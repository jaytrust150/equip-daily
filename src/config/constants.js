// src/config/constants.js

export const CITY_NAME = "Sebastian";
export const AUDIO_BASE_PATH = "/audio/";

// 🔑 OFFICIAL API KEY (API.Bible)
// Note: This is accessed directly via import.meta.env.VITE_BIBLE_API_KEY in components
// Keeping this export for potential future use, but components use the env var directly
export const API_BIBLE_KEY = import.meta.env.VITE_BIBLE_API_KEY;

// 🎨 COLORS
export const COLOR_PALETTE = [
    { name: 'Yellow', code: '#ffeb3b', border: '#fbc02d' },
    { name: 'Green', code: '#a5d6a7', border: '#66bb6a' },
    { name: 'Blue', code: '#90caf9', border: '#42a5f5' },
    { name: 'Pink', code: '#f48fb1', border: '#ec407a' },
    { name: 'Orange', code: '#ffcc80', border: '#ffa726' },
    { name: 'White', code: '#ffffff', border: '#b0bec5' } 
];

export const DEFAULT_NOTE_COLOR = '#2196F3'; 
export const DEFAULT_HIGHLIGHT_DATA = { bg: '#ffeb3b', border: '#fbc02d' };

// 📚 Licensed Bible IDs (API.Bible Commercial Plan)
export const NLT_BIBLE_ID = 'd6e14a625393b4da-01';
export const WEB_BIBLE_ID = '9879dbb7cfe39e4d-01'; // World English Bible (has audio)
export const AUDIO_FALLBACK_VERSION = WEB_BIBLE_ID; // Use when primary version lacks audio
export const DEFAULT_BIBLE_VERSION = NLT_BIBLE_ID; // Always fallback to licensed NLT

// 📚 Licensed Bible Versions - Static list as fallback for when API is slow or unavailable
// The app will dynamically load and override this from the API, but having this ensures
// the version selector always has options, even during network delays
export const BIBLE_VERSIONS = [
  { id: 'd6e14a625393b4da-01', name: 'New Living Translation', abbreviation: 'NLT', language: 'eng' },
  { id: '63097d2a0a2f7db3-01', name: 'New King James Version', abbreviation: 'NKJV', language: 'eng' },
  { id: '9879dbb7cfe39e4d-01', name: 'World English Bible', abbreviation: 'WEB', language: 'eng' },
  { id: 'de4e12af7f28f599-01', name: 'King James Version', abbreviation: 'KJV', language: 'eng' }
];

// 🗺️ Book Name to API ID Mapping (USFM Codes)
export const USFM_MAPPING = {
  "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
  "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
  "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR",
  "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
  "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA", "Jeremiah": "JER", "Lamentations": "LAM",
  "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOE", "Amos": "AMO",
  "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB",
  "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
  "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
  "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL", "Ephesians": "EPH",
  "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH", "1 Timothy": "1TI",
  "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM", "Hebrews": "HEB", "James": "JAS",
  "1 Peter": "1PE", "2 Peter": "2PE", "1 John": "1JN", "2 John": "2JN", "3 John": "3JN",
  "Jude": "JUD", "Revelation": "REV"
};

export const getBookId = (bookName) => USFM_MAPPING[bookName] || "GEN";

export const OSIS_TO_BOOK = Object.fromEntries(Object.entries(USFM_MAPPING).map(([k, v]) => [v, k]));