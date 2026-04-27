[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/faidx-js/push.yml?branch=main&logo=github&style=for-the-badge)](https://github.com/GMOD/faidx-js/actions?query=branch%3Amaster+workflow%3APush+)

## Install

    $ npm install --save @gmod/faidx

## Usage

Accepts a `ReadableStream<Uint8Array>` (FASTA file) and a
`WritableStream<Uint8Array>` (FAI output).

Node.js — write index to a `.fai` file:

```js
import fs from 'fs'
import { Readable, Writable } from 'stream'
import { generateFastaIndex } from '@gmod/faidx'

await generateFastaIndex(
  Writable.toWeb(fs.createWriteStream('genome.fa.fai')),
  Readable.toWeb(fs.createReadStream('genome.fa')),
)
```

Browser — get the FAI index as a string from a `File` input:

```js
import { generateFastaIndex } from '@gmod/faidx'

const { readable, writable } = new TransformStream()
const [fai] = await Promise.all([
  new Response(readable).text(),
  generateFastaIndex(writable, file.stream()),
])
// fai is the FAI index as a string
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
