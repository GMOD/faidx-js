import fs from 'fs'
import { Readable, Writable } from 'stream'

import { expect, test } from 'vitest'

import { generateFastaIndex } from '../src'

test('gather', async () => {
  await generateFastaIndex(
    // @ts-expect-error Node.js WritableStream is slightly different from Web WritableStream
    Writable.toWeb(fs.createWriteStream('test/out.fai')),
    // @ts-expect-error Node.js ReadableStream is slightly different from Web ReadableStream
    Readable.toWeb(
      fs.createReadStream(new URL('./volvox.fa', import.meta.url).pathname),
    ),
  )

  const writtenOutput = fs.readFileSync('test/out.fai', 'utf8')
  const samtoolsFaidxOutput = fs.readFileSync('test/volvox.fa.fai', 'utf8')
  expect(writtenOutput).toMatch(samtoolsFaidxOutput)
})
