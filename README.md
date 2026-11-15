![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/faidx-js/publish.yml?branch=main&logo=github&style=for-the-badge)

## Install

    $ npm install --save @gmod/faidx

## Usage

`FastaIndexTransform` is a `TransformStream<Uint8Array, string>` that turns
FASTA bytes into FAI index lines. It scans the input as bytes, so memory stays
flat however long the sequence lines are.

Node.js — write index to a `.fai` file:

```js
import { openAsBlob } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { FastaIndexTransform } from '@gmod/faidx'

const fasta = await openAsBlob('genome.fa')
await writeFile(
  'genome.fa.fai',
  fasta.stream().pipeThrough(new FastaIndexTransform()),
)
```

Browser — get the FAI index as a string from a `File` input:

```js
import { FastaIndexTransform } from '@gmod/faidx'

const fai = await new Response(
  file
    .stream()
    .pipeThrough(new FastaIndexTransform())
    .pipeThrough(new TextEncoderStream()),
).text()
```

The package also exports `generateFastaIndex(writable, readable)`, which pipes a
`ReadableStream<Uint8Array>` of FASTA into a `WritableStream<Uint8Array>` that
receives the encoded index.

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and release steps.
