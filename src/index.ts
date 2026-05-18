const decoder = new TextDecoder()

/**
 * Simple transform stream to split input by newlines
 */
export class LineSplitter extends TransformStream<Uint8Array, string> {
  constructor() {
    let buffer = ''
    super({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          controller.enqueue(line)
        }
      },
      flush(controller) {
        buffer += decoder.decode()
        if (buffer) {
          controller.enqueue(buffer)
        }
      },
    })
  }
}

/**
 * Transform stream that generates FAI index entries from FASTA input.
 * FAI format: refName \t length \t offset \t lineBases \t lineBytes
 */
export class FastaIndexStream extends TransformStream<string, string> {
  constructor() {
    let pendingMismatchLine: number | undefined
    let refName: string | undefined
    let currOffset = 0
    let refSeqLen = 0
    let lineBytes: number | undefined
    let lineBases: number | undefined
    let refOffset = 0
    let lineNum = 0

    const emitEntry = (
      controller: TransformStreamDefaultController<string>,
    ) => {
      controller.enqueue(
        `${refName}\t${refSeqLen}\t${refOffset}\t${lineBases}\t${lineBytes}\n`,
      )
    }

    const flushPending = (
      controller: TransformStreamDefaultController<string>,
    ) => {
      if (
        pendingMismatchLine !== undefined &&
        pendingMismatchLine !== lineNum - 1
      ) {
        controller.error(
          new Error(
            `Not all lines in file have same width, please check your FASTA file line ${pendingMismatchLine}`,
          ),
        )
        return true
      }
      return false
    }

    super({
      transform(line, controller) {
        // Line length in bytes including the \n that we split on
        const currentLineBytes = line.length + 1

        if (line.startsWith('>')) {
          if (!flushPending(controller)) {
            if (refName !== undefined) {
              emitEntry(controller)
            }

            refSeqLen = 0
            lineBytes = undefined
            lineBases = undefined
            refName = line.slice(1).trim().split(/\s+/)[0]
            currOffset += currentLineBytes
            refOffset = currOffset
            pendingMismatchLine = undefined
          }
        } else {
          // Number of bases (chop off \r if exists)
          const currentLineBases = line.trimEnd().length

          if (lineBases !== undefined && currentLineBases !== lineBases) {
            // Keep only the first mismatch in a sequence — later overwrites
            // would mask a non-last-line mismatch behind a legal short last line
            pendingMismatchLine ??= lineNum
          }

          if (lineBases === undefined) {
            lineBytes = currentLineBytes
            lineBases = currentLineBases
          }

          currOffset += currentLineBytes
          refSeqLen += currentLineBases
        }

        lineNum++
      },
      flush(controller) {
        if (refName === undefined) {
          controller.error(
            new Error(
              'No sequences found in file. Ensure that this is a valid FASTA file',
            ),
          )
        } else if (!flushPending(controller)) {
          emitEntry(controller)
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
    .pipeThrough(new LineSplitter())
    .pipeThrough(new FastaIndexStream())
    .pipeThrough(new TextEncoderStream())
    .pipeTo(fileWriteStream)
}
