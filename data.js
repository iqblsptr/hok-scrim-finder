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

const phonePatterns = {
  'Indonesia': {
    prefix: '+62',
    pattern: /^[0-9]{9,12}$/,
    example: '8123456789 atau 081234567890',
    placeholder: '8123456789'
  },
  'Malaysia': {
    prefix: '+60',
    pattern: /^[0-9]{9,10}$/,
    example: '123456789 atau 1234567890',
    placeholder: '123456789'
  },
  'Philippines': {
    prefix: '+63',
    pattern: /^[0-9]{10}$/,
    example: '9123456789',
    placeholder: '9123456789'
  }
};