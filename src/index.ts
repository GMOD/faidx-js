import { Readable, Transform, Writable } from 'stream'
import { pipeline } from 'stream/promises'

// Simple transform stream to split input by newlines
class LineSplitTransform extends Transform {
  private buffer = ''

  _transform(chunk: Buffer, encoding: unknown, done: (error?: Error) => void) {
    this.buffer += chunk.toString()
    const lines = this.buffer.split('\n')
    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      this.push(Buffer.from(line))
    }
    done()
  }

  _flush(done: (error?: Error) => void) {
    // Push any remaining content in the buffer
    if (this.buffer) {
      this.push(Buffer.from(this.buffer))
    }
    done()
  }
}

/**
 * Transform stream that generates FAI index entries from FASTA input.
 * FAI format: refName \t length \t offset \t lineBases \t lineBytes
 */
class FastaIndexTransform extends Transform {
  /** Whether any FASTA sequences have been found */
  private foundAny = false

  /** Pending line width validation error: [lineNumber, errorMessage] */
  private pendingLineWidthError = undefined as [number, string] | undefined

  /** Current reference sequence name (from header line) */
  private refName: string | undefined

  /** Current byte offset in the file */
  private currOffset = 0

  /** Total length of current reference sequence (in bases) */
  private refSeqLen = 0

  /** Number of bytes per line (including newline character) */
  private lineBytes = undefined as number | undefined

  /** Number of bases per line (excluding whitespace) */
  private lineBases = undefined as number | undefined

  /** Byte offset where current reference sequence starts */
  private refOffset = 0

  /** Current line number being processed */
  private lineNum = 0

  /** Output the current reference sequence's FAI entry */
  private outputFaiEntry() {
    this.push(
      `${this.refName}\t${this.refSeqLen}\t${this.refOffset}\t${this.lineBases}\t${this.lineBytes}\n`,
    )
  }

  _transform(chunk: Buffer, encoding: unknown, done: (error?: Error) => void) {
    const line = chunk.toString()
    // Line length in bytes including the \n that we split on
    const currentLineBytes = chunk.length + 1
    // Number of bases (chop off \r if exists)
    const currentLineBases = line.trim().length

    if (line.startsWith('>')) {
      // Found a FASTA header line
      this.foundAny = true

      // Check if there's a pending line width error from the previous sequence
      if (
        this.pendingLineWidthError &&
        this.pendingLineWidthError[0] !== this.lineNum - 1
      ) {
        done(new Error(this.pendingLineWidthError[1]))
        return
      }

      // Output the FAI entry for the previous sequence (if any)
      if (this.lineNum > 0) {
        this.outputFaiEntry()
      }

      // Reset for the new sequence
      this.refSeqLen = 0
      this.lineBytes = undefined
      this.lineBases = undefined
      this.refName = line.trim().slice(1).split(/\s+/)[0]
      this.currOffset += currentLineBytes
      this.refOffset = this.currOffset
      this.pendingLineWidthError = undefined
    } else {
      // Sequence line - validate line width consistency
      if (this.lineBases && currentLineBases !== this.lineBases) {
        this.pendingLineWidthError = [
          this.lineNum,
          `Not all lines in file have same width, please check your FASTA file line ${this.lineNum}`,
        ]
      }

      // Set line width on the first sequence line
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
      // Output the FAI entry for the last sequence
      if (this.lineNum > 0) {
        this.outputFaiEntry()
      }
      done()
    }
  }
}

export async function generateFastaIndex(
  fileWriteStream: Writable,
  fileDataStream: Readable,
) {
  await pipeline(
    fileDataStream,
    new LineSplitTransform(),
    new FastaIndexTransform(),
    fileWriteStream,
  )
}
