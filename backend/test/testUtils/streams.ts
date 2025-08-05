import { Readable, Writable } from 'stream'

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
