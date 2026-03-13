import ModelModel from '../models/Model.js'
import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

interface CollaboratorCount {
  entity: string
  count: number
}

// npm run script -- getTopModelCollaborators
async function script() {
  // setup
  await connectToMongoose()

  // main functionality
  const results = await ModelModel.aggregate<CollaboratorCount>([
    // Expand the collaborators array into separate documents
    { $unwind: '$collaborators' },
    // Group by collaborator.entity and count occurrences
    {
      $group: {
        _id: '$collaborators.entity',
        count: { $sum: 1 },
      },
    },
    // Sort by count (descending)
    { $sort: { count: -1 } },
    // Keep only the top 10
    { $limit: 10 },
    // Rename _id to entity
    {
      $project: {
        entity: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ])
  log.info({ results }, 'Found top collaborators:')

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
