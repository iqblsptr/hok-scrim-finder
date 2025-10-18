// ===== TRANSLATIONS.JS =====
const translations = {
  id: {
    title: 'Honor of Kings Scrim Finder',
    tagline: 'Temukan Lawan Scrim Terbaik',
    register: 'Daftar Tim',
    findMatch: 'Cari Lawan',
    myTeam: 'Tim Saya',
    notifications: 'Notifikasi',
    uploadResults: 'Upload Hasil',
    teamName: 'Nama Tim',
    captainName: 'Nama Kapten/Manager',
    whatsapp: 'Nomor WhatsApp',
    country: 'Negara',
    province: 'Provinsi',
    teamLogo: 'Logo Tim (Max 10MB)',
    selectCountry: 'Pilih Negara',
    selectProvince: 'Pilih Provinsi',
    indonesia: 'Indonesia',
    malaysia: 'Malaysia',
    philippines: 'Filipina',
    searchingMatch: 'Mencari Lawan',
    cancelSearch: 'Batal Mencari',
    available: 'Tersedia',
    searching: 'Sedang Mencari',
    inMatch: 'Dalam Pertandingan',
    submit: 'Kirim',
    close: 'Tutup',
    matchResult: 'Hasil Pertandingan',
    opponent: 'Lawan',
    score: 'Skor',
    screenshot: 'Screenshot Hasil',
    sendOffer: 'Kirim Tawaran',
    email: 'Email',
    noTeams: 'Tidak ada tim tersedia',
    status: 'Status',
    teamInfo: 'Informasi Tim',
    logout: 'Keluar',
    yourScore: 'Skor Anda',
    opponentScore: 'Skor Lawan',
    uploadScreenshot: 'Upload Screenshot',
    teamsFrom: 'Tim dari'
  },
  en: {
    title: 'Honor of Kings Scrim Finder',
    tagline: 'Find the Best Scrim Opponents',
    register: 'Register Team',
    findMatch: 'Find Match',
    myTeam: 'My Team',
    notifications: 'Notifications',
    uploadResults: 'Upload Results',
    teamName: 'Team Name',
    captainName: 'Captain/Manager Name',
    whatsapp: 'WhatsApp Number',
    country: 'Country',
    province: 'Province',
    teamLogo: 'Team Logo (Max 10MB)',
    selectCountry: 'Select Country',
    selectProvince: 'Select Province',
    indonesia: 'Indonesia',
    malaysia: 'Malaysia',
    philippines: 'Philippines',
    searchingMatch: 'Searching for Match',
    cancelSearch: 'Cancel Search',
    available: 'Available',
    searching: 'Searching',
    inMatch: 'In Match',
    submit: 'Submit',
    close: 'Close',
    matchResult: 'Match Result',
    opponent: 'Opponent',
    score: 'Score',
    screenshot: 'Result Screenshot',
    sendOffer: 'Send Offer',
    email: 'Email',
    noTeams: 'No teams available',
    status: 'Status',
    teamInfo: 'Team Information',
    logout: 'Logout',
    yourScore: 'Your Score',
    opponentScore: 'Opponent Score',
    uploadScreenshot: 'Upload Screenshot',
    teamsFrom: 'Teams from'
  }
};

// ===== DATA.JS =====
const regions = {
  Indonesia: [
    'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten',
    'Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Riau', 'Kepulauan Riau',
    'Bali', 'Kalimantan Timur', 'Kalimantan Barat', 'Sulawesi Selatan', 'Papua'
  ],
  Malaysia: [
    'Kuala Lumpur', 'Selangor', 'Johor', 'Penang', 'Perak',
    'Kedah', 'Kelantan', 'Terengganu', 'Pahang', 'Negeri Sembilan',
    'Melaka', 'Sabah', 'Sarawak'
  ],
  Philippines: [
    'Metro Manila', 'Calabarzon', 'Central Luzon', 'Western Visayas', 'Central Visayas',
    'Davao Region', 'Northern Mindanao', 'Ilocos Region', 'Cagayan Valley', 'Bicol Region',
    'Eastern Visayas', 'Zamboanga Peninsula', 'SOCCSKSARGEN'
  ]
};

const phonePrefix = {
  'Indonesia': '+62',
  'Malaysia': '+60',
  'Philippines': '+63'
};

const phonePatterns = {
  'Indonesia': {
    prefix: '+62',
    pattern: /^[0-9]{9,12}$/, // 9-12 digit
    example: '8123456789 atau 081234567890',
    placeholder: '8123456789'
  },
  'Malaysia': {
    prefix: '+60',
    pattern: /^[0-9]{9,10}$/, // 9-10 digit
    example: '123456789 atau 1234567890',
    placeholder: '123456789'
  },
  'Philippines': {
    prefix: '+63',
    pattern: /^[0-9]{10}$/, // 10 digit
    example: '9123456789',
    placeholder: '9123456789'
  }
};