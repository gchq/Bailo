# p-mongo-queue

A light-weight way to create queues using MongoDB. Forked from `mhassan1/mongodb-queue-up`, which itself is a fork of
`chilts/mongodb-queue`. This fork enforces modern code standards and replaces previous callback-based approaches with
promises.

## Usage

```js
import { MongoClient } from 'mongodb'
import pMongoQueue from 'p-mongo-queue'

const url = 'mongodb://localhost:27017/'
const client = new MongoClient(url)
await client.connect()

// Create a queue
const db = client.db('test')
const queue = PMongoQueue(db, 'my-queue')

// One time operation to create the required indexes
await queue.createIndexes()

// Add a message to a queue
await queue.add('Hello, World!')

// Get a message from the queue
const msg = await queue.get()

console.log(`msg.id = ${msg.id}`)
console.log(`msg.ack = ${msg.ack}`)
console.log(`msg.payload = ${msg.payload}`) // 'Hello, World!'
console.log(`msg.tries = ${msg.tries}`)

// Remove a message from the queue
await queue.ping(msg.ack)

// Process all messages from the queue, two at a time
queue.process(2, (msg) => {
  console.log(`msg.payload = ${msg.payload}`)
  // At the end of this function the message is automatically removed from the queue.
})
```

Messages are never removed from the queue, even if processed. To remove messages that have successfully completed:

```js
await queue.clean()
```

# API

### `PMongoQueue(db, name[, options])`

- `db` MongoDB client
- `name` Queue name
- `options` [Options](#pMongoQueue-options) for the queue

Creates a queue instance.

`db` should be a v4 compatible client. `name` is used for both the queue name and collection name.

<a id="pMongoQueue-options"></a>

### Options

The default values are shown after each option key.

```js
{
    // Another queue instance to place dead items on after `maxRetries` has been reached
    deadQueue: undefined,

    // Maximum retries before stopping processing of an item
    maxRetries: 5,

    // Delay in seconds before processing an item
    delay: 0,

    // How long before a message should be returned to the queue
    visibility: 30
}
```

### Operations

#### `Queue.add(payload[, options]): Promise<string | string[]>`

Add items to the queue. `payload` can either be a single value, or an array of values. [Options](#pMongoQueue-options)
are identical to queue options.

The return value is an ID for each item provided. This can be used for tracking the item between functions.

```js
// add one item
await queue.add('Hello, World!')

// add multiple items
await queue.add(['A', 'B', 'C'])

// add an object
await queue.add({ a: 'A', b: 'B' })

// delay visibility
await queue.add('Hello', { delay: 120 })
```

#### `get([options]): Promise<QueueMessage | undefined>`

Add items to the queue. `payload` can either be a single value, or an array of values. [Options](#pMongoQueue-options)
are identical to queue options. [QueueMessage](#pMongoQueue-message) is a representation of the message on the queue.

```js
// get one item
const message = await queue.get()

// override default queue setting
const message = await queue.get({ visibility: 10 })
```

#### `ack(ack): Promise<string>`

Marks an item as complete. `ack` should be the `msg.ack` value.

```js
const msg = await queue.get()
await queue.ack(msg.ack)
// message removed from queue
```

#### `ping(ack, options): Promise<string>`

Extends the processing time of an item. `ack` should be the `msg.ack` value. [Options](#pMongoQueue-options) are
identical to queue options.

```js
const msg = await queue.get()
await queue.ack(msg.ack)
// message removed from queue
```

<a id="pMongoQueue-message"></a>

### Queue Message

A queue message is a representation of a message on the queue.

```js
{
    ack: string,
    id: string,
    payload: any,
    tries: number
}
```

### Processing

#### `Queue.process([parallelism=1], processor): void`

Parallelism is an optimal parameter to specify the number of simultaneous jobs to be processed. Processor is a function
to be called to process each item. The function should take in as a single parameter a
[QueueMessage](#pMongoQueue-message).

```js
queue.process((msg) => {
  console.log(msg.payload)
})
```

#### `Queue.stop(): Promise<void>`

Stops the queue from processing new items. Existing items will continue to be processed. The promise resolves when all
existing items have been processed.

#### `Queue.start(): Promise<void>`

Starts the queue processing new items. The promise resolves when the first new item has been processed, or no items are
currently available.

### Events

### Administration

#### `Queue.createIndexes(): Promise<string>`

Create indexes on the queue collection, required for fast use of queue. Returns the `indexName` generated.

#### `Queue.clean(): Promise<void>`

Removes all processed items from the queue.

#### `Queue.size(): Promise<number>`

Returns the total number of messages that are waiting in the queue.

#### `Queue.inFlight(): Promise<number>`

Returns the total number of messages that are currently in flight. ie. that have been received but not yet acked.

#### `Queue.done(): Promise<number>`

Returns the total number of messages that have been processed correctly in the queue.

#### `Queue.total(): Promise<number>`

Returns the total number of messages that has ever been in the queue, including all current messages.

## Licence

Initially licensed by chilts under `MIT` (https://chilts.mit-license.org/2014/), then licensed by mhassan1 under `MIT`.
New changes released under the `MIT` license with Crown Copyright.
