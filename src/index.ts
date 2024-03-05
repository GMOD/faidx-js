import split2 from 'split2'
import pump from 'pump'
import { Writable, Readable, Transform } from 'stream'

// creates an FAI file from a FASTA file streaming in
class FastaIndexTransform extends Transform {
  foundAny = false
  possibleBadLine = undefined as [number, string] | undefined
  refName: string | undefined
  currOffset = 0
  refSeqLen = 0
  lineBytes = undefined as number | undefined
  lineBases = undefined as number | undefined
  refOffset = undefined as number | undefined
  lineNum = 0

  _transform(chunk: Buffer, encoding: unknown, done: (error?: Error) => void) {
    const line = chunk.toString()
    // line length in bytes including the \n that we split on
    const currentLineBytes = chunk.length + 1
    // chop off \r if exists
    const currentLineBases = line.trim().length
    if (line.startsWith('>')) {
      this.foundAny = true
      if (
        this.possibleBadLine &&
        this.lineNum !== undefined &&
        this.possibleBadLine[0] !== this.lineNum - 1
      ) {
        done(new Error(this.possibleBadLine[1]))
        return
      }
      if (this.lineNum > 0) {
        this.push(
          `${this.refName}\t${this.refSeqLen}\t${this.refOffset}\t${this.lineBases}\t${this.lineBytes}\n`,
        )
      }
      // reset
      this.refSeqLen = 0
      this.lineBytes = undefined
      this.lineBases = undefined
      this.refName = line.trim().slice(1).split(/\s+/)[0]
      this.currOffset += currentLineBytes
      this.refOffset = this.currOffset
      this.possibleBadLine = undefined
    } else {
      if (this.lineBases && currentLineBases !== this.lineBases) {
        this.possibleBadLine = [
          this.lineNum,
          `Not all lines in file have same width, please check your FASTA file line ${this.lineNum}`,
        ]
      }
      if (this.lineBytes === undefined && this.lineBases === undefined) {
        this.lineBytes = currentLineBytes
        this.lineBases = currentLineBases
      }
      this.currOffset += currentLineBytes
      this.refSeqLen += currentLineBases
    }

    this.lineNum++
    done()
  }

  _flush(done: (error?: Error) => void) {
    if (!this.foundAny) {
      done(
        new Error(
          'No sequences found in file. Ensure that this is a valid FASTA file',
        ),
      )
    } else {
      if (this.lineNum > 0) {
        this.push(
          `${this.refName}\t${this.refSeqLen}\t${this.refOffset}\t${this.lineBases}\t${this.lineBytes}\n`,
        )
      }
      done()
    }
  }
}

export async function generateFastaIndex(
  fileWriteStream: Writable,
  fileDataStream: Readable,
) {
  return new Promise((resolve, reject) => {
    pump(
      fileDataStream,
      split2(/\n/),
      new FastaIndexTransform(),
      fileWriteStream,
      function (err) {
        if (err) {
          reject(err)
        } else {
          resolve('success')
        }
      },
    )
  })
}
