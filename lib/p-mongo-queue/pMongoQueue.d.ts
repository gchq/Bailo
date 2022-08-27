import { EventEmitter } from 'events'
import { Db } from 'mongodb'

export default class Queue extends EventEmitter {
  constructor(db: Db, name: string, opts?: QueueOptions)

  createIndexes(): Promise<string>

  add(payload: Payload): Promise<string>

  add(payload: ArrayPayload): Promise<string[]>

  add(payload: Payload, opts: QueueOptions): Promise<string>

  add(payload: ArrayPayload, opts: QueueOptions): Promise<string[]>

  get(): Promise<QueueMessage | undefined>

  get(opts: QueueOptions): Promise<QueueMessage | undefined>

  ping(ack: string): Promise<string>

  ping(ack: string, opts: QueueOptions): Promise<string>

  ack(ack: string): Promise<string>

  fail(ack: string): Promise<string>

  clean(): Promise<any>

  total(): Promise<number>

  size(): Promise<number>

  inFlight(): Promise<number>

  done(): Promise<number>

  process(processor: (msg: QueueMessage) => ProcessResponse): void

  process(parallelism: number, processor: (msg: QueueMessage) => ProcessResponse): void

  start(): Promise<void>

  stop(): Promise<void>
}

export type ProcessResponse = void | Promise<void>
export type Payload = any
export type ArrayPayload = Array<any>

export interface QueueOptions {
  deadQueue?: Queue | undefined
  delay?: number | undefined
  maxRetries?: number | undefined
  visibility?: number | undefined
}

export interface QueueMessage {
  ack: string
  id: string
  payload: Payload | ArrayPayload
  tries: number
}
