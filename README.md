# `@brandonkal/url-purify`

`@brandonkal/url-purify` is a JavaScript library that cleans URLs by removing tracking parameters and other unnecessary elements. It also normalized and detects the ID in YouTube links. It is forked from the [ClearURLs](https://github.com/ClearURLs/Addon/) browser extension.

## Usage

```bash
pnpm i -D @brandonkal/url-purify
```

Example usage:

```ts
import { cleanURL } from '@brandonkal/url-purify';

const output = await cleanURL('https://twitter.com/Br_Nowak/status/1586618354307039234?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1586669502292434944%7Ctwgr%5E2432a774390f7dcbd3b885ac9570cacdb3c48c9d%7Ctwcon%5Es3_&ref_url=https%3A%2F%2Fwww.wprost.pl%2Fpolityka%2F10927933%2Fkuriozalny-wpis-malopolskiej-kurator-oswiaty-przed-1-listopada-internauci-bezlitosni.html');

console.log(output.url); // Output: 'https://twitter.com/Br_Nowak/status/1586618354307039234'

```

## Copyright

`@brandonkal/url-purify` utilizes the [ClearURLs](https://github.com/ClearURLs/Addon/) browser extension's source code. It is licensed under the [LGPL-3.0](./LICENSE) license.
