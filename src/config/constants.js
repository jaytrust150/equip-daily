// src/config/constants.js

export const CITY_NAME = "Sebastian";
export const AUDIO_BASE_PATH = "/audio/";

// 🔑 OFFICIAL API KEY (API.Bible)
export const API_BIBLE_KEY = import.meta.env.VITE_API_BIBLE_KEY;

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

// 📚 Bible Versions
export const BIBLE_VERSIONS = [
  // --- Popular English Versions ---
  { id: 'c315fa9f71d4af3a-01', name: 'New Living Translation', abbreviation: 'NLT' },
  { id: '78a9f6124f344018-01', name: 'New International Version', abbreviation: 'NIV' },
  { id: 'a761ca71e0b3ddcf-01', name: 'New American Standard Bible 2020', abbreviation: 'NASB20' },
  { id: 'b8ee27bcd1cae43a-01', name: 'New American Standard Bible 1995', abbreviation: 'NASB' },
  { id: '6f11a7de016f942e-01', name: 'The Message', abbreviation: 'MSG' },
  { id: 'a81b73293d3080c9-01', name: 'Amplified Bible', abbreviation: 'AMP' },
  { id: 'de4e12af7f28f599-01', name: 'King James Version', abbreviation: 'KJV' },
  { id: '9879dbb7cfe39e4d-01', name: 'World English Bible', abbreviation: 'WEB' },
  { id: '06125adad2d5898a-01', name: 'American Standard (ASV)', abbreviation: 'ASV' },

  // --- Spanish / Portuguese ---
  { id: '826f63861180e056-01', name: 'Nueva Traducción Viviente', abbreviation: 'NTV' },
  { id: '41a6caa722a21d88-01', name: 'Nova Versão Transformadora', abbreviation: 'NVT' },
  { id: 'e3f420b9665abaeb-01', name: 'La Biblia de las Américas', abbreviation: 'LBLA' },
  { id: 'ce11b813f9a27e20-01', name: 'Nueva Biblia de las Américas', abbreviation: 'NBLA' },
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

export const DEFAULT_BIBLE_VERSION = 'c315fa9f71d4af3a-01'; // NLT

export const OSIS_TO_BOOK = Object.fromEntries(Object.entries(USFM_MAPPING).map(([k, v]) => [v, k]));