/**
 * Bible Book ID Mappings
 * 
 * TypeScript mapping of full Bible book names to their USFM/OSIS abbreviation codes.
 * These codes are used by API.Bible for:
 * - Chapter fetching endpoints
 * - Audio Bible requests
 * - Search functionality
 * 
 * Format: 'Full Book Name': 'USFM_CODE'
 * Example: 'Genesis': 'GEN', '1 Corinthians': '1CO'
 * 
 * @see https://ubsicap.github.io/usfm/identification/books.html
 */
export const BIBLE_BOOK_IDS: Record<string, string> = {
  'Genesis': 'GEN',
  'Exodus': 'EXO',
  'Leviticus': 'LEV',
  'Numbers': 'NUM',
  'Deuteronomy': 'DEU',
  'Joshua': 'JOS',
  'Judges': 'JDG',
  'Ruth': 'RUT',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  'Ezra': 'EZR',
  'Nehemiah': 'NEH',
  'Esther': 'EST',
  'Job': 'JOB',
  'Psalms': 'PSA',
  'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC',
  'Song of Solomon': 'SNG',
  'Isaiah': 'ISA',
  'Jeremiah': 'JER',
  'Lamentations': 'LAM',
  'Ezekiel': 'EZK',
  'Daniel': 'DAN',
  'Hosea': 'HOS',
  'Joel': 'JOL',
  'Amos': 'AMO',
  'Obadiah': 'OBA',
  'Jonah': 'JON',
  'Micah': 'MIC',
  'Nahum': 'NAM',
  'Habakkuk': 'HAB',
  'Zephaniah': 'ZEP',
  'Haggai': 'HAG',
  'Zechariah': 'ZEC',
  'Malachi': 'MAL',
  'Matthew': 'MAT',
  'Mark': 'MRK',
  'Luke': 'LUK',
  'John': 'JHN',
  'Acts': 'ACT',
  'Romans': 'ROM',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  'Galatians': 'GAL',
  'Ephesians': 'EPH',
  'Philippians': 'PHP',
  'Colossians': 'COL',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  'Titus': 'TIT',
  'Philemon': 'PHM',
  'Hebrews': 'HEB',
  'James': 'JAS',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  'Jude': 'JUD',
  'Revelation': 'REV',
};

export const DEVOTIONAL_DATA = [
  {
    date: '11.13',
    title: 'Born of the Spirit: A New Heart and a New Spirit',
    references: [
      { book: '1 Corinthians', chapter: 15, verse: '45', translation: 'NLT' },
      { book: '2 Peter', chapter: 1, verse: '21' },
      { book: 'John', chapter: 4, verse: '23-24' },
      { book: 'Ezekiel', chapter: 36, verse: '26-27' },
      { book: 'Romans', chapter: 8, verse: '14-16' }
    ]
  },
  {
    date: '9.3',
    title: 'Many Members, One Body: The Importance of Unity in the Body of Christ',
    references: [
      { book: '1 Corinthians', chapter: 12, verse: '12-27', translation: 'NASB95' }
    ]
  }
];