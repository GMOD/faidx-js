import fs from 'fs'

import { expect, test } from 'vitest'

import { generateFastaIndex } from '../src/index.ts'

function stringReadable(
  text: string,
  chunkSize = text.length,
): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  let at = 0
  return new ReadableStream({
    pull(controller) {
      controller.enqueue(bytes.subarray(at, at + chunkSize))
      at += chunkSize
      if (at >= bytes.length) {
        controller.close()
      }
    },
  })
}

async function collectOutput(fasta: string, chunkSize?: number) {
  const chunks: Uint8Array[] = []
  await generateFastaIndex(
    new WritableStream<Uint8Array>({
      write(chunk) {
        chunks.push(chunk)
      },
    }),
    stringReadable(fasta, chunkSize),
  )
  return Buffer.concat(chunks).toString('utf8')
}

function expectError(fasta: string) {
  return expect(
    generateFastaIndex(
      new WritableStream<Uint8Array>({ write: () => undefined }),
      stringReadable(fasta),
    ),
  ).rejects
}

test('matches samtools faidx output', async () => {
  const fasta = fs.readFileSync(new URL('./volvox.fa', import.meta.url), 'utf8')
  const expected = fs.readFileSync(
    new URL('./volvox.fa.fai', import.meta.url),
    'utf8',
  )
  expect(await collectOutput(fasta)).toBe(expected)
})

test('output is independent of chunk boundaries', async () => {
  const fasta = fs.readFileSync(new URL('./volvox.fa', import.meta.url), 'utf8')
  const expected = fs.readFileSync(
    new URL('./volvox.fa.fai', import.meta.url),
    'utf8',
  )
  for (const chunkSize of [1, 2, 3, 7, 64, 4096]) {
    expect(await collectOutput(fasta, chunkSize)).toBe(expected)
  }
})

test('short last line in last sequence is allowed', async () => {
  // ">seq1\n" = 6 bytes offset; first line 8 bases / 9 bytes; total 12 bases
  expect(await collectOutput('>seq1\nACGTACGT\nACGT\n')).toBe(
    'seq1\t12\t6\t8\t9\n',
  )
})

test('inconsistent line widths in last sequence errors', async () => {
  // seq2 has a short middle line that is not the last line — should error
  await expectError(
    '>seq1\nACGTACGT\n>seq2\nACGTACGT\nACGT\nACGTACGT\n',
  ).toThrow(/same width/)
})

test('two consecutive short lines mid-sequence errors', async () => {
  // Two short lines in a row — the earlier one is not the last data line,
  // so this must be flagged even though the *latest* mismatch is the last line.
  await expectError('>seq1\nACGTACGT\nACGT\nAC\n').toThrow(/same width/)
})

test('empty file errors', async () => {
  await expectError('').toThrow(/No sequences found/)
})

test('refName handles space after >', async () => {
  expect(await collectOutput('> seq1 description\nACGT\n')).toBe(
    'seq1\t4\t19\t4\t5\n',
  )
})

test('missing final newline', async () => {
  expect(await collectOutput('>seq1\nACGT')).toBe('seq1\t4\t6\t4\t5\n')
})

test(String.raw`crlf line endings do not count \r as a base`, async () => {
  expect(await collectOutput('>seq1\r\nACGT\r\nACGT\r\n')).toBe(
    'seq1\t8\t7\t4\t6\n',
  )
})

test('blank line between records', async () => {
  // matches `samtools faidx`
  expect(await collectOutput('>seq1\nACGT\n\n>seq2\nACGT\n')).toBe(
    'seq1\t4\t6\t4\t5\nseq2\t4\t18\t4\t5\n',
  )
})

test('zero-length record emits 0 widths, not undefined', async () => {
  expect(await collectOutput('>seq1\n>seq2\nACGT\n')).toBe(
    'seq1\t0\t6\t0\t0\nseq2\t4\t12\t4\t5\n',
  )
})

test('header-only file emits a zero-length record', async () => {
  expect(await collectOutput('>seq1\n')).toBe('seq1\t0\t6\t0\t0\n')
})
