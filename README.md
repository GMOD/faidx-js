![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/faidx-js/publish.yml?branch=main&logo=github&style=for-the-badge)

## Install

    $ npm install --save @gmod/faidx

## Usage

`generateFastaIndex` reads a FASTA file from a `ReadableStream<Uint8Array>` and
writes the FAI index to a `WritableStream<Uint8Array>`.

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

`FastaIndexTransform` is also exported if you want the
`TransformStream<Uint8Array, string>` on its own.

`FastaIndexTransform` scans the input as bytes and never buffers it as text, so
memory use stays flat however long the sequence lines are.

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)

## Publishing

GitHub Actions publishes each release with
[trusted publishing](https://docs.npmjs.com/about-trusted-publishing). Start a
release with:

```bash
pnpm version patch  # or minor/major
```
