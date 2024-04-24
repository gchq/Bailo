import { AccessRequestInterface } from '../../models/AccessRequest.js'
import { EntryKind, ModelInterface } from '../../models/Model.js'
import { ReleaseInterface } from '../../models/Release.js'

export const model: ModelInterface = {
  // Basic model example
  id: 'basic-model-abcdef',
  kind: EntryKind.Model,
  teamId: undefined,

  name: 'Basic Model',
  description:
    'This model has standard permissions and settings.  Use this model for testing generic new features and services.',
  collaborators: [
    {
      entity: 'user:user',
      roles: ['owner', 'msro', 'mtr'],
    },
    {
      entity: 'user:consumer',
      roles: ['consumer'],
    },
    {
      entity: 'user:owner',
      roles: ['owner'],
    },
    {
      entity: 'user:admin',
      roles: ['owner', 'contributor', 'consumer'],
    },
  ],
  settings: {
    ungovernedAccess: true,
  },

  card: {
    schemaId: 'minimal-general-v10-beta',
    version: 5,
    metadata: {
      overview: {
        modelSummary: `*Input*: Photo(s) or video(s)

*Output*: For each face detected in a photo or video, the model outputs:

- Bounding box coordinates
- Facial landmarks (up to 34 per face)
- Facial orientation (roll, pan, and tilt angles)
- Detection and landmarking confidence scores.

No identity or demographic information is detected.

*Model architecture*: MobileNet CNN fine-tuned for face detection with a single shot multibox detector.`,
        tags: ['PyTorch', 'Summarization', 'Minimal', 'Example'],
      },
      anotherPage: {
        questionOne: 'An example short answer.',
        questionTwo: 'An example short answer.',
      },
    },
    createdBy: 'user',
  },

  visibility: 'public',
  deleted: false,

  createdAt: new Date(),
  updatedAt: new Date(),
}

export const release: ReleaseInterface = {
  modelId: 'example',
  modelCardVersion: 0,
  comments: [],

  semver: 'v1.0.0',
  notes: `This makes major steps forward in both speed and quality of \
results given by the model.  Here is a table of the updated speed:

| String Size | v0.3      | v1.0      |
|-------------|-----------|-----------|
| 1KB         | 12.3 MBps | 536 MBps  |
| 1MB         | 190 MBps  | 19.2 GBps |
| 1GB         | 192 MBps  | 23.6 GBps |

Other information could be included here.  This is just an example.`,

  minor: false,
  draft: true,

  fileIds: [],
  images: [],

  deleted: false,

  createdBy: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const accessRequest: AccessRequestInterface = {
  id: 'example-access-request-abcdef',
  modelId: 'basic-model-abcdef',
  schemaId: 'minimal-access-request-general-v10-beta',

  metadata: {
    overview: {
      name: 'Example Access Request',
      endDate: '2029-11-19',
      entities: ['user'],
    },
  },

  comments: [],

  deleted: false,

  createdBy: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
}
