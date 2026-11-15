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

async function indexWithChunkSize(fasta: string, chunkSize: number) {
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

async function collectOutput(fasta: string) {
  const outputs = await Promise.all(
    [1, 2, 3, fasta.length].map(n => indexWithChunkSize(fasta, n)),
  )
  expect(new Set(outputs).size).toBe(1)
  return outputs[0]
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
    expect(await indexWithChunkSize(fasta, chunkSize)).toBe(expected)
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

test('short last line followed by blank lines', async () => {
  // matches `samtools faidx`
  expect(await collectOutput('>seq1\nACGT\nAC\n\n>seq2\nACGT\n')).toBe(
    'seq1\t6\t6\t4\t5\nseq2\t4\t21\t4\t5\n',
  )
  expect(await collectOutput('>seq1\nACGT\nAC\n\n')).toBe('seq1\t6\t6\t4\t5\n')
  expect(await collectOutput('>seq1\nACGT\nAC\n\n\n>seq2\nACGT\n')).toBe(
    'seq1\t6\t6\t4\t5\nseq2\t4\t22\t4\t5\n',
  )
  expect(
    await collectOutput('>seq1\r\nACGT\r\nAC\r\n\r\n>seq2\r\nACGT\r\n'),
  ).toBe('seq1\t6\t7\t4\t6\nseq2\t4\t26\t4\t6\n')
})

test('several trailing blank lines', async () => {
  expect(await collectOutput('>seq1\nACGT\n\n\n')).toBe('seq1\t4\t6\t4\t5\n')
})

test('last line longer than the first errors', async () => {
  await expectError('>seq1\nAC\nACGT\n').toThrow(/same width.*line 3$/)
})

test('error names the short line, counting from 1', async () => {
  await expectError('>seq1\nACGTACGT\nACGT\nAC\n').toThrow(/line 3$/)
})

test('sequence after a blank line errors', async () => {
  await expectError('>seq1\nACGT\n\nACGT\n').toThrow(/Blank line.*line 3$/)
  await expectError('>seq1\nACGT\nAC\n\nAC\n').toThrow(/same width.*line 3$/)
  await expectError('>seq1\n\nACGT\n').toThrow(/Blank line.*line 2$/)
})

test('matches htslib faidx test fixture', async () => {
  const fasta = fs.readFileSync(
    new URL('./htslib/faidx.fa', import.meta.url),
    'utf8',
  )
  const expected = fs.readFileSync(
    new URL('./htslib/faidx.fa.fai', import.meta.url),
    'utf8',
  )
  expect(await collectOutput(fasta)).toBe(expected)
})

test('a crlf line followed by an lf line ends the sequence', async () => {
  expect(await collectOutput('>a\nACGT\r\nACGT\n')).toBe('a\t8\t3\t4\t6\n')
  await expectError('>a\nACGT\r\nACGT\nAC\n').toThrow(/same width.*line 3$/)
})

test('an lf line followed by a crlf line errors', async () => {
  await expectError('>a\nACGT\nACGT\r\nAC\n').toThrow(/same width.*line 3$/)
})

test('sequence before the first header errors', async () => {
  await expectError('ACGT\n>a\nAC\n').toThrow(
    /before the first header.*line 1$/,
  )
})

test('blank lines before the first header are skipped', async () => {
  expect(await collectOutput('\n>a\nACGT\n')).toBe('a\t4\t4\t4\t5\n')
})

test('duplicate names keep the first record, like samtools', async () => {
  expect(await collectOutput('>a\nACGT\n>b\nAC\n>a\nACGTACGT\n')).toBe(
    'a\t4\t3\t4\t5\nb\t2\t11\t2\t3\n',
  )
})
