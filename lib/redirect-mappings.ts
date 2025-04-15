// Adapted from Farside
// https://github.com/benbusby/farside/blob/main/services/mappings.go

const mappings = [
  {
    name: 'YouTube',
    urlPattern: '^https?:\\/\\/(www\\.)?youtu(\\.be|be\\.com)',
    targets: ['piped', 'invidious'],
  },
  {
    name: 'Twitter',
    urlPattern: '^https?:\\/\\/(www\\.)?twitter\\.com|x\\.com',
    targets: ['nitter'],
  },
  {
    name: 'Reddit',
    urlPattern: '^https?:\\/\\/(www\\.)?reddit\\.com',
    targets: ['libreddit', 'redlib', 'teddit'],
  },
  {
    name: 'Google Search',
    urlPattern: '^https?:\\/\\/(www\\.)?google\\.com',
    targets: ['whoogle', 'searxng'],
  },
  {
    name: 'Instagram',
    urlPattern: '^https?:\\/\\/(www\\.)?instagram\\.com',
    targets: ['proxigram'],
  },
  {
    name: 'Wikipedia',
    urlPattern: '^https?:\\/\\/(www\\.)?wikipedia\\.org',
    targets: ['wikiless'],
  },
  {
    name: 'Medium',
    urlPattern: '^https?:\\/\\/(www\\.)?medium\\.com',
    targets: ['scribe'],
  },
  {
    name: 'Odysee',
    urlPattern: '^https?:\\/\\/(www\\.)?odysee\\.com',
    targets: ['librarian'],
  },
  {
    name: 'Imgur',
    urlPattern: '^https?:\\/\\/(www\\.)?imgur\\.com',
    targets: ['rimgo'],
  },
  {
    name: 'Google Translate',
    urlPattern: '^https?:\\/\\/(www\\.)?translate\\.google\\.com',
    targets: ['lingva', 'simplytranslate'],
  },
  {
    name: 'TikTok',
    urlPattern: '^https?:\\/\\/(www\\.)?tiktok\\.com',
    targets: ['proxitok'],
  },
  {
    name: 'Fandom',
    urlPattern: '^https?:\\/\\/(www\\.)?.*fandom\\.com',
    targets: ['breezewiki'],
  },
  {
    name: 'IMDB',
    urlPattern: '^https?:\\/\\/(www\\.)?imdb\\.com',
    targets: ['libremdb'],
  },
  {
    name: 'Quora',
    urlPattern: '^https?:\\/\\/(www\\.)?quora\\.com',
    targets: ['quetre'],
  },
  {
    name: 'GitHub',
    urlPattern: '^https?:\\/\\/(www\\.)?github\\.com',
    targets: ['gothub'],
  },
  {
    name: 'StackOverflow',
    urlPattern: '^https?:\\/\\/(www\\.)?stackoverflow\\.com',
    targets: ['anonymousoverflow'],
  },
];

export { mappings };
