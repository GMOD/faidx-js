import fs from 'fs'
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
