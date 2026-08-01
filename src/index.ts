const NEWLINE = 0x0a
const CARRIAGE_RETURN = 0x0d
const GREATER_THAN = 0x3e

interface FastaRecord {
  name: string
  /** byte offset of the first base */
  offset: number
  /** bases seen so far */
  length: number
  /** bases on the record's first sequence line */
  lineBases: number
  /** bytes on the record's first sequence line, including the newline */
  lineBytes: number
  sawSeqLine: boolean
}

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
    let lineNum = 0
    let mismatchLine: number | undefined

    // the line being scanned, which may be split across chunks
    let atLineStart = true
    let isHeader = false
    let headerText = ''
    let lineLen = 0
    let lastByte: number | undefined

    // A short line is only legal as a record's last line, so the first mismatch
    // is held until we know whether another line followed it. Holding the
    // *first* rather than the latest keeps a legal short last line from masking
    // an illegal one earlier in the record.
    const reportMismatch = (c: TransformStreamDefaultController<string>) => {
      const invalid = mismatchLine !== undefined && mismatchLine !== lineNum - 1
      if (invalid) {
        c.error(
          new Error(
            `Not all lines in file have same width, please check your FASTA file line ${mismatchLine}`,
          ),
        )
      }
      return invalid
    }

    /** returns false once the stream has been errored */
    const endLine = (c: TransformStreamDefaultController<string>) => {
      const lineBytes = lineLen + 1
      let ok = true

      if (isHeader) {
        ok = !reportMismatch(c)
        if (ok) {
          if (current) {
            c.enqueue(formatEntry(current))
          }
          offset += lineBytes
          // drop the leading '>', then take the first whitespace-delimited token
          const [name = ''] = (headerText + decoder.decode())
            .slice(1)
            .trim()
            .split(/\s+/)
          current = {
            name,
            offset,
            length: 0,
            lineBases: 0,
            lineBytes: 0,
            sawSeqLine: false,
          }
          mismatchLine = undefined
        }
      } else {
        // a trailing \r from a CRLF line ending is not a base
        const bases = lineLen - (lastByte === CARRIAGE_RETURN ? 1 : 0)
        if (current) {
          if (current.sawSeqLine) {
            if (bases !== current.lineBases) {
              mismatchLine ??= lineNum
            }
          } else {
            current.sawSeqLine = true
            current.lineBases = bases
            current.lineBytes = lineBytes
          }
          current.length += bases
        }
        offset += lineBytes
      }

      lineNum++
      atLineStart = true
      isHeader = false
      headerText = ''
      lineLen = 0
      lastByte = undefined
      return ok
    }

    super({
      transform(chunk, c) {
        let i = 0
        let ok = true
        while (i < chunk.length && ok) {
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
            ok = endLine(c)
            i = nl + 1
          }
        }
      },
      flush(c) {
        // a final line with no trailing newline still counts
        if (atLineStart || endLine(c)) {
          if (current === undefined) {
            c.error(
              new Error(
                'No sequences found in file. Ensure that this is a valid FASTA file',
              ),
            )
          } else if (!reportMismatch(c)) {
            c.enqueue(formatEntry(current))
          }
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
