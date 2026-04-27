[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/faidx-js/push.yml?branch=main&logo=github&style=for-the-badge)](https://github.com/GMOD/faidx-js/actions?query=branch%3Amaster+workflow%3APush+)

## Install

    $ npm install --save @gmod/faidx

## Usage

Operates on a `ReadableStream<Uint8Array>` and `WritableStream<Uint8Array>`.

```js
import fs from 'fs'
import { generateFastaIndex } from '@gmod/faidx'
import { Readable, Writable } from 'stream'

// In Node.js, you can convert Node streams to Web Streams
const write = Writable.toWeb(fs.createWriteStream('out.fa.fai'))
const read = Readable.toWeb(fs.createReadStream('out.fa'))
await generateFastaIndex(write, read)
```

```js
// In the browser, you can use File/Blob streams
const file = // ... from input element
await generateFastaIndex(
  new WritableStream({
    write(chunk) {
      // ... handle chunk
    },
  }),
  file.stream(),
)
```

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)

## Publishing

[Trusted publishing](https://docs.npmjs.com/about-trusted-publishing) via GitHub
Actions.

```bash
npm version patch  # or minor/major
```
