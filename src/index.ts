const NEWLINE = 0x0a
const CARRIAGE_RETURN = 0x0d
const GREATER_THAN = 0x3e

interface FastaRecord {
  name: string
  /** byte offset of the first base */
  offset: number
  /** bases seen so far */
  length: number
  /** bases on the record's first sequence line, 0 until there is one */
  lineBases: number
  /** bytes on the record's first sequence line, including the newline */
  lineBytes: number
  /** set once a short or blank line ends the sequence, thrown if more follows */
  errorIfMoreBases?: string
}

const widthError = (line: number) =>
  `Not all lines in file have same width, please check your FASTA file line ${line}`

function formatEntry(r: FastaRecord) {
  return `${r.name}\t${r.length}\t${r.offset}\t${r.lineBases}\t${r.lineBytes}\n`
}

/**
 * Transform stream that generates FAI index entries from FASTA input.
 * FAI format: refName \t length \t offset \t lineBases \t lineBytes
 *
 * Scans the raw bytes instead of decoding the file to text: a FAI records byte
 * offsets, and only header lines ever need decoding. Nothing longer than one
 * header is ever buffered, so single-line-per-sequence FASTAs stream fine.
 */
export class FastaIndexTransform extends TransformStream<Uint8Array, string> {
  constructor() {
    // only ever fed header lines, and flushed at the end of each one
    const decoder = new TextDecoder()

    let current: FastaRecord | undefined
    let offset = 0
    let lineNum = 1

    // the line being scanned, which may be split across chunks
    let atLineStart = true
    let isHeader = false
    let headerText = ''
    let lineLen = 0
    let lastByte: number | undefined

    const addSequenceLine = (r: FastaRecord, bases: number, bytes: number) => {
      if (bases === 0) {
        r.errorIfMoreBases ??= `Blank line inside sequence ${r.name}, please check your FASTA file line ${lineNum}`
      } else if (r.errorIfMoreBases !== undefined) {
        throw new Error(r.errorIfMoreBases)
      } else if (r.lineBases === 0) {
        r.lineBases = bases
        r.lineBytes = bytes
      } else if (bases > r.lineBases) {
        throw new Error(widthError(lineNum))
      } else if (bases < r.lineBases) {
        r.errorIfMoreBases = widthError(lineNum)
      }
      r.length += bases
    }

    const endLine = (c: TransformStreamDefaultController<string>) => {
      const lineBytes = lineLen + 1
      offset += lineBytes
      if (isHeader) {
        if (current) {
          c.enqueue(formatEntry(current))
        }
        // drop the leading '>', then take the first whitespace-delimited token
        const [name = ''] = (headerText + decoder.decode())
          .slice(1)
          .trim()
          .split(/\s+/)
        current = { name, offset, length: 0, lineBases: 0, lineBytes: 0 }
      } else {
        // a trailing \r from a CRLF line ending is not a base
        const bases = lineLen - (lastByte === CARRIAGE_RETURN ? 1 : 0)
        if (current) {
          addSequenceLine(current, bases, lineBytes)
        }
      }
      lineNum++
      atLineStart = true
      isHeader = false
      headerText = ''
      lineLen = 0
      lastByte = undefined
    }

    super({
      transform(chunk, c) {
        let i = 0
        while (i < chunk.length) {
          if (atLineStart) {
            isHeader = chunk[i] === GREATER_THAN
            atLineStart = false
          }
          const nl = chunk.indexOf(NEWLINE, i)
          const end = nl === -1 ? chunk.length : nl
          if (end > i) {
            if (isHeader) {
              headerText += decoder.decode(chunk.subarray(i, end), {
                stream: true,
              })
            }
            lastByte = chunk[end - 1]
            lineLen += end - i
          }
          if (nl === -1) {
            i = chunk.length
          } else {
            endLine(c)
            i = nl + 1
          }
        }
      },
      flush(c) {
        // a final line with no trailing newline still counts
        if (!atLineStart) {
          endLine(c)
        }
        if (current) {
          c.enqueue(formatEntry(current))
        } else {
          throw new Error(
            'No sequences found in file. Ensure that this is a valid FASTA file',
          )
        }
      },
    })
  }
}

export async function generateFastaIndex(
  fileWriteStream: WritableStream<Uint8Array>,
  fileDataStream: ReadableStream<Uint8Array>,
) {
  await fileDataStream
    .pipeThrough(new FastaIndexTransform())
    .pipeThrough(new TextEncoderStream())
    .pipeTo(fileWriteStream)
}
