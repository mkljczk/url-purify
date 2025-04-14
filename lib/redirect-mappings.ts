// Adapted from Farside
// https://github.com/benbusby/farside/blob/main/services/mappings.go

const mappings = [
  {
    "name": "YouTube",
    "urlPattern": "^https?:\\/\\/youtu(\\.be|be\\.com)",
    "targets": ["piped", "invidious"],
  },
  {
    "name": "Twitter",
    "urlPattern": "^https?:\\/\\/twitter\\.com|x\\.com",
    "targets": ["nitter"],
  },
  {
    "name": "Reddit",
    "urlPattern": "^https?:\\/\\/reddit\\.com",
    "targets": ["libreddit", "redlib", "teddit"],
  },
  {
    "name": "Google Search",
    "urlPattern": "^https?:\\/\\/google\\.com",
    "targets": ["whoogle", "searxng"],
  },
  {
    "name": "Instagram",
    "urlPattern": "^https?:\\/\\/instagram\\.com",
    "targets": ["proxigram"],
  },
  {
    "name": "Wikipedia",
    "urlPattern": "^https?:\\/\\/wikipedia\\.org",
    "targets": ["wikiless"],
  },
  {
    "name": "Medium",
    "urlPattern": "^https?:\\/\\/medium\\.com",
    "targets": ["scribe"],
  },
  {
    "name": "Odysee",
    "urlPattern": "^https?:\\/\\/odysee\\.com",
    "targets": ["librarian"],
  },
  {
    "name": "Imgur",
    "urlPattern": "^https?:\\/\\/imgur\\.com",
    "targets": ["rimgo"],
  },
  {
    "name": "Google Translate",
    "urlPattern": "^https?:\\/\\/translate\\.google\\.com",
    "targets": ["lingva", "simplytranslate"],
  },
  {
    "name": "TikTok",
    "urlPattern": "^https?:\\/\\/tiktok\\.com",
    "targets": ["proxitok"],
  },
  {
    "name": "Fandom",
    "urlPattern": "^https?:\\/\\/.*fandom\\.com",
    "targets": ["breezewiki"],
  },
  {
    "name": "IMDB",
    "urlPattern": "^https?:\\/\\/imdb\\.com",
    "targets": ["libremdb"],
  },
  {
    "name": "Quora",
    "urlPattern": "^https?:\\/\\/quora\\.com",
    "targets": ["quetre"],
  },
  {
    "name": "GitHub",
    "urlPattern": "^https?:\\/\\/github\\.com",
    "targets": ["gothub"],
  },
  {
    "name": "StackOverflow",
    "urlPattern": "^https?:\\/\\/stackoverflow\\.com",
    "targets": ["anonymousoverflow"],
  },
];

export { mappings };
