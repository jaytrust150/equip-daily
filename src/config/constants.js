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

// 🔊 AUDIO BIBLE SUPPORT MAPPING
// Maps text Bible IDs to their corresponding audio Bible IDs from API.Bible
// Based on the 'relatedDbl' field from audio Bibles API response
export const AUDIO_BIBLE_MAP = {
  '9879dbb7cfe39e4d-01': '105a06b6146d11e7-01', // WEB (World English Bible 2013 Drama NT)
  '4c3eda00cd317568': '7fb0e05721aa424f-01', // Bengali IRV
  'efd8a351a07d4264': '2d681a4ce8b8479f-01', // Bengali BCV
  'a3644a98420c2703': '2abea5341ec34814-01', // Gujarati IRV
  '7b0652d936a271b6': '9c67e54fbdca4e3e-01', // Hindi HCV
  '2133003bb8b5e62b': '9c67e54fbdca4e3e-01', // Hindi HCV
  '1e8ab327edbce67f': '6b227b38145d4383-01', // Hindi IRV OT
  '86f89195f23eeedf': '55a24bb0d6d44a32-01', // Chhattisgarhi
  '7a45ff3b316d0102': '55a24bb0d6d44a32-01', // Chhattisgarhi
  '08389f036844c2de': '850cc50e70574aba-01', // Kannada
  'a33a100f04f2752e': 'c6889eadbbc14852-01', // Kannada IRV
  'de295e9ba65f6d0f': '4496fa3731f54ccd-01', // Malayalam
  'd8e10d078df603c9': '4496fa3731f54ccd-01', // Malayalam
  '3ea0147e32eebe47': '57e37c60c3a94d4f-01', // Malayalam IRV
  '8c49129a458d4059': 'ec1e42889cad4316-01', // Marathi IRV
  '032ec262506b719f': '232eeaf9dc544361-01', // Tamil
  'c07426c589f15c78': '232eeaf9dc544361-01', // Tamil
  '03a021185023710b': '5b168850d8ff4fe2-01', // Tamil IRV
  '5b835ce16a1703ff': '0d7b2453e9ae4513-01', // Telugu IRV
  'de0270810140edf9': '9e11d376e401469c-01', // Urdu IRV
  'd199679f805f5b29': 'b3e56f2d3a124ab3-01', // Assamese IRV
  '24722a3b9010fa47': '26b7a1cd2f8f4878-01', // Arabic ONAV
  'b17e246951402e50': '26b7a1cd2f8f4878-01', // Arabic ONAV
  '2f293d3e4580fcec': '4bd4740816ed4a97-01', // Kurdish Sorani
  '9ab28a81b9c4587d': '4bd4740816ed4a97-01', // Kurdish Sorani
  'dc17d25bd95e4ed8': '04308387908b41f0-01', // Hausa HCB
  '0ab0c764d56a715d': '04308387908b41f0-01', // Hausa HCB
  'a8a97eebae3c98e4': '05580b0ab1e849eb-01', // Hebrew Living NT
  'a36fc06b086699f1': '1b319c1d55564e45-01', // Igbo
  '8e42b297877a4a57': '1b319c1d55564e45-01', // Igbo
  '611f8eb23aec8f13': '3533f7929cde418c-01', // Swahili
  '6eda79520b919447': '0a0157c765374368-01', // Shona
  'e8d99085dcb83ab5': '0a0157c765374368-01', // Shona
  '78a78459948b4668': '6e21c09d8edb4838-01', // Twi Akuapem
  'b6aee081108c0bc6': '6e21c09d8edb4838-01', // Twi Akuapem
  'c97c5e017bdf893c': '03d2ea6f8f7c4a19-01', // Twi Asante
  '18f6cf27f7b43297': '03d2ea6f8f7c4a19-01', // Twi Asante
  'e07823794ce9c0ea': 'f7a4f623ca6040c0-01', // Ewe
  'ac90bfebd4ee9c4d': 'f7a4f623ca6040c0-01', // Ewe
  'f38380d52ccc605a': '6fdd664c807642d3-01', // Lingala
  'ac6b6b7cd1e93057': '6fdd664c807642d3-01', // Lingala
  'da34f369635c82b8': '14b06ff3b2cf5e97-01', // Luganda
  'f276be3571f516cb': '14b06ff3b2cf5e97-01', // Luganda
  '5c9c2862a4595a64': '5d1902ecdf5349d3-01', // Luo
  '4d4df8722134c5ee': '5d1902ecdf5349d3-01', // Luo
  '1849509e461c9a00': '3e52d5ea138e4da6-01', // Oromo
  '8ed5ea15c6dfa5bd': '3e52d5ea138e4da6-01', // Oromo
  '6c696cd1d82e2723': '039316d8ba074002-01', // Ukrainian
  '2ed679542fab921d': '2691a33c58f144c3-01', // Yoruba
  'b8d1feac6e94bd74': '2691a33c58f144c3-01', // Yoruba
  '496cafdffc23197b': '3f915ab248534bc7-01', // Haitian Creole
};

// Helper function to check if a Bible version has audio support
export const hasAudioSupport = (bibleId) => {
  return AUDIO_BIBLE_MAP.hasOwnProperty(bibleId);
};