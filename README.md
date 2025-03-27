# `url-purify`

[![GitHub Repo stars](https://img.shields.io/github/stars/mkljczk/url-purify)](https://github.com/mkljczk/url-purify)
[![GitHub License](https://img.shields.io/github/license/mkljczk/url-purify)](https://github.com/mkljczk/url-purify?tab=LGPL-3.0-1-ov-file#readme)
[![NPM Version](https://img.shields.io/npm/v/%40mkljczk%2Furl-purify)
![NPM Downloads](https://img.shields.io/npm/dw/%40mkljczk%2Furl-purify)](https://www.npmjs.com/package/@mkljczk/url-purify)

`url-purify` is a work-in-progress JavaScript library that cleans URLs by removing tracking parameters and other unnecessary elements. It is forked from the [ClearURLs](https://github.com/ClearURLs/Addon/) browser extension.

## Usage

To use `url-purify`, first install it using your preferred package manager:

```bash
npm install @mkljczk/url-purify
```

Example usage:

```ts
import { URLPurify } from '@mkljczk/url-purify';

const purify = new URLPurify({
  hashUrl: 'https://rules2.clearurls.xyz/rules.minify.hash',
  ruleUrl: 'https://rules2.clearurls.xyz/data.minify.json',
  onFetchedRules: (_hash, _rules) => {
    const url = 'https://twitter.com/Br_Nowak/status/1586618354307039234?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1586669502292434944%7Ctwgr%5E2432a774390f7dcbd3b885ac9570cacdb3c48c9d%7Ctwcon%5Es3_&ref_url=https%3A%2F%2Fwww.wprost.pl%2Fpolityka%2F10927933%2Fkuriozalny-wpis-malopolskiej-kurator-oswiaty-przed-1-listopada-internauci-bezlitosni.html';
    const cleanUrl = purify.clearUrl(url);
    console.log(cleanUrl); // Output: 'https://twitter.com/Br_Nowak/status/1586618354307039234'
  },
});

```

## Copyright

`url-purify` utilizes the [ClearURLs](https://github.com/ClearURLs/Addon/) browser extension's source code. It is licensed under the [LGPL-3.0](./LICENSE) license.
