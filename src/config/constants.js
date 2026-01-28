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

// 📚 Bible Versions - Expanded Popular List
export const BIBLE_VERSIONS = [
  // --- Most Popular English Versions ---
  { id: 'd6e14a625393b4da-01', name: 'New Living Translation', abbreviation: 'NLT', language: 'eng' },
  { id: '78a9f6124f344018-01', name: 'New International Version', abbreviation: 'NIV', language: 'eng' },
  { id: 'de4e12af7f28f599-01', name: 'King James Version', abbreviation: 'KJV', language: 'eng' },
  { id: '63097d2a0a2f7db3-01', name: 'New King James Version', abbreviation: 'NKJV', language: 'eng' },
  { id: '40072c4a5aba4022-01', name: 'New American Standard Bible 2020', abbreviation: 'NASB2020', language: 'eng' },
  { id: 'a761ca71e0b3ddcf-01', name: 'New American Standard Bible 1995', abbreviation: 'NASB1995', language: 'eng' },
  { id: 'bba9f40183526463-01', name: 'Berean Standard Bible', abbreviation: 'BSB', language: 'eng' },
  { id: 'cfe535a08e5f5564-01', name: 'Berean Study Bible', abbreviation: 'BSB', language: 'eng' },
  { id: 'aeae687987064c9e-01', name: 'Christian Standard Bible', abbreviation: 'CSB', language: 'eng' },
  { id: '9879dbb7cfe39e4d-01', name: 'World English Bible', abbreviation: 'WEB', language: 'eng' },
  { id: '6f11a7de016f942e-01', name: 'The Message', abbreviation: 'MSG', language: 'eng' },
  { id: '7142879509583d59-01', name: 'Easy-to-Read Version', abbreviation: 'ERV', language: 'eng' },
  { id: 'f72b840c855f362c-04', name: 'Good News Translation', abbreviation: 'GNT', language: 'eng' },
  { id: 'af6006a9cf2ca74f-01', name: 'Lexham English Bible', abbreviation: 'LEB', language: 'eng' },
  { id: 'f00a11a6e8e0faa1-01', name: 'New English Translation', abbreviation: 'NET', language: 'eng' },

  // --- Classic English Versions ---
  { id: '592420522e16049f-01', name: 'American Standard Version', abbreviation: 'ASV', language: 'eng' },
  { id: '61fd76eafa1577c2-01', name: '1599 Geneva Bible', abbreviation: 'GNV', language: 'eng' },
  { id: 'c315fa9f71d4af3a-01', name: 'Geneva Bible 1599', abbreviation: 'GNV', language: 'eng' },
  { id: 'fb894b99c5ba7e0d-01', name: "Young's Literal Translation", abbreviation: 'YLT', language: 'eng' },
  { id: '93306481890dd923-01', name: 'Douay-Rheims Bible', abbreviation: 'DRB', language: 'eng' },
  { id: 'cb2e6000b840be7a-01', name: 'Tyndale Bible', abbreviation: 'TYNDALE', language: 'eng' },

  // --- Spanish Versions ---
  { id: '06125adad2d5898a-01', name: 'Reina Valera 1858', abbreviation: 'RV1858', language: 'spa' },
  { id: '7d467c1c11f57528-01', name: 'Reina Valera 1865', abbreviation: 'RV1865', language: 'spa' },
  { id: 'b38babdd-01', name: 'Reina Valera 1899', abbreviation: 'RV1899', language: 'spa' },
  { id: '1bef8b2d1c0c0c61-01', name: 'Reina Valera Actualizada 2009', abbreviation: 'RVA09', language: 'spa' },
  { id: '2bcf166e0009ffdb-01', name: 'La Biblia de las Américas', abbreviation: 'LBLA', language: 'spa' },
  { id: '81aa0564f984ba11-01', name: 'Traducción en Lenguaje Actual', abbreviation: 'TLA', language: 'spa' },
  { id: '5e0bb1adeafe5513-02', name: 'Nueva Versión Bíblica al Español', abbreviation: 'NVBSE', language: 'spa' },
  { id: 'd19e546094837821-01', name: 'Nueva Biblia Viva', abbreviation: 'NRV', language: 'spa' },

  // --- Portuguese Versions ---
  { id: 'eb48e4a9fd0fdd87-01', name: 'Almeida Século 21', abbreviation: 'A21', language: 'por' },

  // --- Chinese Versions ---
  { id: '2d568f2c51274516-01', name: 'Chinese Union Version Simplified', abbreviation: 'CUVS', language: 'cmn' },
  { id: '3c1b7ef084f9f725-01', name: 'Chinese Union Version Traditional', abbreviation: 'CUVT', language: 'cmn' },

  // --- Other Languages ---
  { id: '0a3e0f74e2b0fda8-01', name: 'Arabic Bible: Smith & Van Dyke + Concordant (NT)', abbreviation: 'ARVDCT', language: 'arb' },
  { id: '996e4ba52e5f5991-01', name: 'الكتاب الحياة (Arabic Life Application Bible)', abbreviation: 'ALAB', language: 'arb' },
  { id: 'aa7d9f80b8f8f1ba-01', name: 'Louis Segond 1910', abbreviation: 'LSG', language: 'fra' },
  { id: 'a5f6102b41fbbba1-01', name: 'Synodal Translation (1876)', abbreviation: 'RUSBL', language: 'rus' },
  { id: 'a5cf0564f9f9ee80-01', name: 'Het Boek (NBG51)', abbreviation: 'NBG51', language: 'nld' },
  { id: '8e8323c56da138a1-01', name: 'Bangla New Platform', abbreviation: 'BNP', language: 'ben' },
  { id: '55212e3a5c2b18cd-01', name: 'Gujarati Today\'s Version', abbreviation: 'GUJTOV', language: 'guj' },
  { id: 'e5e5d9ba41fbbba1-01', name: '1876 Turkish Translation', abbreviation: 'TR1876', language: 'tur' },
  { id: 'c478735fa4206dca-01', name: 'Română Actualizată Dumnezeu', abbreviation: 'RAD', language: 'ron' },
  { id: '90f0f1bfbc527469-01', name: 'Afrikaans Bybel 1953 met Engelse vertalings', abbreviation: 'ABE', language: 'afr' },
  { id: '9aba13bdd1dc51b7-01', name: 'Ang Bagong Tipan: Magandang Balita Biblia', abbreviation: 'BT', language: 'tgl' },
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

export const DEFAULT_BIBLE_VERSION = 'd6e14a625393b4da-01'; // NLT

export const OSIS_TO_BOOK = Object.fromEntries(Object.entries(USFM_MAPPING).map(([k, v]) => [v, k]));