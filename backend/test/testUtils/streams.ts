import { Readable, Writable } from 'node:stream'

export class MockReadable extends Readable {
  _read(_size: number) {}
}

export class MockWritable extends Writable {
  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    // Default to success
    callback()
  }
  // Helper to trigger an error
  triggerError(error: Error) {
    this.emit('error', error)
  }
  // Helper to trigger an error
  triggerFinish() {
    this.emit('finish')
  }
}

export function makeReadable({
  chunks = [Buffer.from('default')],
  failWith,
  autoEnd = true,
}: {
  chunks?: any[]
  failWith?: Error
  autoEnd?: boolean
} = {}) {
  let endCalled = false

  class ControlledReadable extends Readable {
    idx = 0
    _read() {
      if (failWith) {
        this.destroy(failWith)
        return
      }
      if (this.idx < chunks.length) {
        this.push(chunks[this.idx++])
      } else if (autoEnd && !endCalled) {
        endCalled = true
        // Signal end of stream
        this.push(null)
      }
    }
    endNow() {
      if (!endCalled) {
        endCalled = true
        this.push(null)
      }
    }
  }

  return new ControlledReadable()
}
