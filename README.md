[![Build Status](https://img.shields.io/github/actions/workflow/status/GMOD/faidx-js/push.yml?branch=main&logo=github&style=for-the-badge)](https://github.com/GMOD/faidx-js/actions?query=branch%3Amaster+workflow%3APush+)

## Install

    $ npm install --save @gmod/faidx

## Usage

Operates on a readStream/writeStream

```js
import { generateFastaIndex } from "@gmod/faidx";
const write = fs.createWriteStream("out.fa.fai");
const read = fs.createReadStream("out.fa");
await generateFastaIndex(write, read);
```

## Academic Use

This package was written with funding from the [NHGRI](http://genome.gov) as
part of the [JBrowse](http://jbrowse.org) project. If you use it in an academic
project that you publish, please cite the most recent JBrowse paper, which will
be linked from [jbrowse.org](http://jbrowse.org).

## License

MIT © [Colin Diesh](https://github.com/cmdcolin)
