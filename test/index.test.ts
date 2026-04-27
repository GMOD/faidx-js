import fs from 'fs'
import { Readable, Writable } from 'stream'

import { expect, test } from 'vitest'

import { generateFastaIndex } from '../src'

function stringReadable(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text))
      controller.close()
    },
  })
}

async function collectOutput(
  fasta: string,
): Promise<string> {
  const chunks: Uint8Array[] = []
  await generateFastaIndex(
    new WritableStream<Uint8Array>({ write(chunk) { chunks.push(chunk) } }),
    stringReadable(fasta),
  )
  return new TextDecoder().decode(
    chunks.reduce((acc, c) => {
      const merged = new Uint8Array(acc.length + c.length)
      merged.set(acc)
      merged.set(c, acc.length)
      return merged
    }, new Uint8Array()),
  )
}

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

test('short last line in last sequence is allowed', async () => {
  // ">seq1\n" = 6 bytes offset; first line 8 bases / 9 bytes; total 12 bases
  const output = await collectOutput('>seq1\nACGTACGT\nACGT\n')
  expect(output).toBe('seq1\t12\t6\t8\t9\n')
})

test('inconsistent line widths in last sequence errors', async () => {
  // seq2 has a short middle line that is not the last line — should error
  const fasta = '>seq1\nACGTACGT\n>seq2\nACGTACGT\nACGT\nACGTACGT\n'
  await expect(
    generateFastaIndex(
      new WritableStream<Uint8Array>({ write() {} }),
      stringReadable(fasta),
    ),
  ).rejects.toThrow()
})
