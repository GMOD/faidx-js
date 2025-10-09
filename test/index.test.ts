import fs from 'fs'

import { expect, test } from 'vitest'

import { generateFastaIndex } from '../src'

test('gather', async () => {
  await generateFastaIndex(
    fs.createWriteStream('test/out.fai'),
    fs.createReadStream(require.resolve('./volvox.fa')),
  )

  const writtenOutput = fs.readFileSync('test/out.fai', 'utf8')
  const samtoolsFaidxOutput = fs.readFileSync('test/volvox.fa.fai', 'utf8')
  expect(writtenOutput).toMatch(samtoolsFaidxOutput)
})

// xtest('hg38', async () => {
//   await generateFastaIndex(
//     fs.createWriteStream('test/hg38.fai'),
//     fs.createReadStream(
//       '/media/cdiesh/Beezle/maf/hgdownload.soe.ucsc.edu/goldenPath/hg38/bigZips/hg38.fa',
//     ),
//   )
//
//   const writtenOutput = fs.readFileSync('test/hg38.fai', 'utf8')
//   const samtoolsFaidxOutput = fs.readFileSync(
//     '/media/cdiesh/Beezle/maf/hgdownload.soe.ucsc.edu/goldenPath/hg38/bigZips/hg38.fa.fai',
//     'utf8',
//   )
//   expect(writtenOutput).toMatch(samtoolsFaidxOutput)
// }, 500_000)
