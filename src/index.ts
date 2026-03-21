const decoder = new TextDecoder()
const encoder = new TextEncoder()

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
        buffer = lines.pop() || ''
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
    let foundAny = false
    let pendingLineWidthError: [number, string] | undefined
    let refName: string | undefined
    let currOffset = 0
    let refSeqLen = 0
    let lineBytes: number | undefined
    let lineBases: number | undefined
    let refOffset = 0
    let lineNum = 0

    super({
      transform(line, controller) {
        // Line length in bytes including the \n that we split on
        const currentLineBytes = encoder.encode(line).length + 1
        // Number of bases (chop off \r if exists)
        const currentLineBases = line.trim().length

        if (line.startsWith('>')) {
          foundAny = true

          if (
            pendingLineWidthError &&
            pendingLineWidthError[0] !== lineNum - 1
          ) {
            controller.error(new Error(pendingLineWidthError[1]))
            return
          }

          if (lineNum > 0) {
            controller.enqueue(
              `${refName}\t${refSeqLen}\t${refOffset}\t${lineBases}\t${lineBytes}\n`,
            )
          }

          refSeqLen = 0
          lineBytes = undefined
          lineBases = undefined
          refName = line.trim().slice(1).split(/\s+/)[0]
          currOffset += currentLineBytes
          refOffset = currOffset
          pendingLineWidthError = undefined
        } else {
          if (lineBases && currentLineBases !== lineBases) {
            pendingLineWidthError = [
              lineNum,
              `Not all lines in file have same width, please check your FASTA file line ${lineNum}`,
            ]
          }

          if (lineBytes === undefined && lineBases === undefined) {
            lineBytes = currentLineBytes
            lineBases = currentLineBases
          }

          currOffset += currentLineBytes
          refSeqLen += currentLineBases
        }

        lineNum++
      },
      flush(controller) {
        if (!foundAny) {
          controller.error(
            new Error(
              'No sequences found in file. Ensure that this is a valid FASTA file',
            ),
          )
        } else {
          if (lineNum > 0) {
            controller.enqueue(
              `${refName}\t${refSeqLen}\t${refOffset}\t${lineBases}\t${lineBytes}\n`,
            )
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
    .pipeThrough(new LineSplitter())
    .pipeThrough(new FastaIndexStream())
    .pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(new TextEncoder().encode(chunk))
        },
      }),
    )
    .pipeTo(fileWriteStream)
}
