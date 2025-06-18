import { OpenAPIRegistry, RouteConfig } from '@asteasolutions/zod-to-openapi'
import { AnyZodObject, z } from 'zod'

import { ScanState } from '../connectors/fileScanning/Base.js'
import { CollaboratorRoles } from '../models/Model.js'
import { Decision, ResponseKind } from '../models/Response.js'
import { ArtefactKind } from '../models/Scan.js'
import { TokenScope } from '../models/Token.js'
import { SchemaKind } from '../types/enums.js'

export const registry = new OpenAPIRegistry()

export type PathConfig = RouteConfig & { schema: AnyZodObject }
export function registerPath(config: PathConfig) {
  const routeConfig: RouteConfig = {
    ...config,
  }

  if (config.schema) {
    routeConfig.request = {
      params: config.schema.shape.params,
      query: config.schema.shape.query,
    }

    if (config.schema.shape.body) {
      routeConfig.request.body = {
        content: {
          'application/json': {
            schema: config.schema.shape.body,
          },
        },
      }
    }
  }

  delete (routeConfig as any).schema
  registry.registerPath(routeConfig)
}

export const errorSchemaContent = {
  'application/json': {
    schema: z.object({
      name: z.string().openapi({ example: 'Error' }),
      message: z.string().openapi({ example: 'A human readable error message' }),
      context: z.unknown().openapi({ example: { example: 'Contextual information about the request' } }),
    }),
  },
}

export const modelCardInterfaceSchema = z.object({
  schemaId: z.string().openapi({ example: 'minimal-general-v10-beta' }),
  version: z.number().openapi({ example: 5 }),
  createdBy: z.string().openapi({ example: 'user' }),
  metadata: z.object({
    overview: z.object({
      tags: z.array(z.string()).openapi({ example: ['tag', 'tagb'] }),
    }),
  }),
})

export const modelCardRevisionInterfaceSchema = z.object({
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  schemaId: z.string().openapi({ example: 'minimal-general-v10-beta' }),

  version: z.number().openapi({ example: 5 }),
  metadata: z.object({
    overview: z.object({
      tags: z.array(z.string()).openapi({ example: ['tag', 'tagb'] }),
    }),
  }),

  createdBy: z.string().openapi({ example: 'user' }),
  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const modelInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'yolo-v4-abcdef' }),

  name: z.string().openapi({ example: 'Yolo v4' }),
  kind: z.string().openapi({ example: 'model' }),
  description: z.string().openapi({ example: 'You only look once' }),
  card: modelCardInterfaceSchema,

  collaborators: z.array(
    z.object({
      entity: z.string().openapi({ example: 'user:user' }),
      roles: z.array(z.string()).openapi({ example: ['owner', 'contributor'] }),
    }),
  ),

  visibility: z.string().openapi({ example: 'public' }),
  deleted: z.boolean().openapi({ example: false }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const scanInterfaceSchema = z.object({
  artefactKind: z.nativeEnum(ArtefactKind).openapi({ example: 'file' }),
  fileId: z.string().optional().openapi({ example: '507f1f77bcf86cd799439011' }),
  repositoryName: z.string().optional().openapi({ example: 'yolo-v4-abcdef' }),
  imageDigest: z
    .string()
    .optional()
    .openapi({ example: 'sha256:cbbf2f9a99b47fc460d422812b6a5adff7dfee951d8fa2e4a98caa0382cfbdbf' }),
  toolName: z.string().openapi({ example: 'Clam AV' }),
  scannerVersion: z.string().optional().openapi({ example: '1.4.2' }),
  state: z.nativeEnum(ScanState).openapi({ example: 'complete' }),
  isInfected: z.boolean().optional().openapi({ example: true }),
  viruses: z.array(z.string().openapi({ example: 'Win.Test.EICAR_HDB-1' })).optional(),
  lastRunAt: z.string().openapi({ example: new Date().toISOString() }),
  _id: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
  id: z.string().openapi({ example: '67cecbffd2a0951d1693b396' }),
})

export const fileWithScanInterfaceSchema = z.object({
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),

  name: z.string().openapi({ example: 'yolo.tar.gz' }),
  size: z.number().openapi({ example: 1024 }),
  mime: z.string().openapi({ example: 'application/tar' }),

  path: z.string().openapi({ example: '/model/yolo-v4-abcdef/files/abcdef' }),

  complete: z.boolean().openapi({ example: true }),

  avScan: z.array(scanInterfaceSchema).optional(),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const releaseInterfaceSchema = z.object({
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  modelCardVersion: z.number().openapi({ example: 5 }),

  semver: z.string().openapi({ example: 'v1.0.0' }),
  notes: z.string().openapi({ example: 'An example release' }),

  minor: z.boolean().openapi({ example: false }),
  draft: z.boolean().openapi({ example: false }),

  fileIds: z.array(z.string()).openapi({ example: ['507f1f77bcf86cd799439011'] }),
  images: z.array(z.string()).openapi({ example: ['/yolo-v4-abcdef/example:v1.0.0'] }),

  comments: z
    .array(
      z.object({
        comment: z.string().openapi({ example: 'This a comment' }),
        user: z.string().openapi({ example: 'User' }),
        createdAt: z.string().openapi({ example: new Date().toISOString() }),
      }),
    )
    .optional(),

  deleted: z.boolean().openapi({ example: false }),

  files: z.array(fileWithScanInterfaceSchema).optional(),

  createdBy: z.string().openapi({ example: 'user' }),
  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const reviewInterfaceSchema = z.object({
  semver: z.string().optional().openapi({ example: 'v1.0.0' }),
  accessRequestId: z.string().optional().openapi({ example: undefined }),
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),

  kind: z.string().openapi({ example: 'release' }),
  role: z.string().openapi({ example: 'mtr' }),

  responses: z.array(z.string().optional()),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const responseInterfaceSchema = z.object({
  user: z.string().optional().openapi({ example: 'Joe Bloggs' }),
  kind: z.nativeEnum(ResponseKind).openapi({ example: ResponseKind.Comment }),
  role: z.string().optional().openapi({ example: 'mtr' }),
  decision: z.nativeEnum(Decision).optional().openapi({ example: Decision.Approve }),
  comment: z.string().optional().openapi({ example: 'Looks good!' }),
  commentEditedAt: z.string().optional().openapi({ example: new Date().toISOString() }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const accessRequestInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'looking-at-pictures-zyxwvu' }),
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),

  schemaId: z.string().openapi({ example: 'minimal-access-request-v1' }),
  metadata: z.object({
    overview: z.object({
      name: z.string().openapi({ example: 'Looking at Pictures' }),
      entities: z.array(z.string()).openapi({ example: ['user:user', 'group:test'] }),

      endDate: z.string().optional().openapi({ example: new Date().toISOString() }),
    }),
  }),

  comments: z
    .array(
      z.object({
        comment: z.string().openapi({ example: 'This a comment' }),
        user: z.string().openapi({ example: 'User' }),
        createdAt: z.string().openapi({ example: new Date().toISOString() }),
      }),
    )
    .optional(),

  deleted: z.boolean().openapi({ example: false }),

  createdBy: z.string().openapi({ example: 'user' }),
  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const schemaInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'minimal-upload-v1' }),
  name: z.string().openapi({ example: 'Minimal Upload Schema v1' }),
  description: z.string().openapi({ example: 'A minimal upload schema' }),

  active: z.boolean().openapi({ example: true }),
  hidden: z.boolean().openapi({ example: false }),

  kind: z.nativeEnum(SchemaKind).openapi({ example: 'model' }),
  jsonSchema: z.object({}).openapi({ example: {} }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const inferenceInterfaceSchema = z.object({
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  image: z.string().openapi({ example: 'yolov4' }),
  tag: z.string().openapi({ example: 'latest' }),

  description: z.string().openapi({ example: 'A deployment for running Yolo V4 in Bailo' }),

  settings: z.object({
    processorType: z.string().openapi({ example: 'cpu' }),
    memory: z.number().optional().openapi({ example: 4 }),
    port: z.number().openapi({ example: 8080 }),
  }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const permissionDetailSchema = z.discriminatedUnion('hasPermission', [
  z.object({
    hasPermission: z.literal(true),
  }),
  z.object({
    hasPermission: z.literal(false),
    info: z.string(),
  }),
])

export const entryUserPermissionsSchema = z.object({
  editEntry: permissionDetailSchema,
  editEntryCard: permissionDetailSchema,

  createRelease: permissionDetailSchema,
  editRelease: permissionDetailSchema,
  deleteRelease: permissionDetailSchema,

  pushModelImage: permissionDetailSchema,

  createInferenceService: permissionDetailSchema,
  editInferenceService: permissionDetailSchema,
  deleteInferenceService: permissionDetailSchema,

  exportMirroredModel: permissionDetailSchema,
})

export const accessRequestUserPermissionsSchema = z.object({
  editAccessRequest: permissionDetailSchema,
  deleteAccessRequest: permissionDetailSchema,
})

export const userTokenSchema = z.object({
  description: z.string().openapi({ example: 'user token' }),

  scope: z.nativeEnum(TokenScope).openapi({ example: 'models' }),
  modelIds: z.array(z.string()).openapi({ example: ['yozlo-v4-abcdef'] }),
  actions: z.array(z.string()).openapi({ example: ['image:read', 'file:read'] }),

  accessKey: z.string().openapi({ example: 'bailo-iot4hj3890tqaji' }),
  secretKey: z.string().openapi({ example: '987895347u89fj389agre' }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const userInterfaceSchema = z.object({
  dn: z.string().openapi({ example: 'user' }),
  isAdmin: z.boolean().openapi({ example: false }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const webhookInterfaceSchema = z.object({
  id: z.string().openapi({ example: 'webhook-zyxwvu' }),
  modelId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  name: z.string().openapi({ example: 'webhook' }),

  uri: z.string().openapi({ example: 'http://host:8080/webhook' }),
  token: z.string().openapi({ example: 'abcd' }),
  insecureSSL: z.boolean().openapi({ example: false }),
  events: z
    .array(z.string())
    .openapi({ example: ['createRelease', 'updateRelease', 'createReviewResponse', 'createAccessRequest'] }),
  active: z.boolean().openapi({ example: true }),

  deleted: z.boolean().openapi({ example: false }),

  createdAt: z.string().openapi({ example: new Date().toISOString() }),
  updatedAt: z.string().openapi({ example: new Date().toISOString() }),
})

export const UserInformationSchema = z.object({
  email: z.string().optional().openapi({ example: 'user@example.com' }),
  name: z.string().optional().openapi({ example: 'Joe Bloggs' }),
  organisation: z.string().optional().openapi({ example: 'Acme Corp' }),
})

export const reviewRoleSchema = z.object({
  id: z.string().openapi({ example: 'reviewer' }),
  name: z.string().openapi({ example: 'Reviewer' }),
  short: z.string().openapi({ example: 'reviewer' }),
  kind: z.string().openapi({ example: 'schema' }),
  description: z.string().openapi({ example: 'This is an example review role' }),
  defaultEntities: z.array(z.string()).openapi({ example: ['user:user'] }),
  lockEntities: z.boolean().openapi({ example: false }),
  CollaboratorRoles: z.string().optional().openapi({ example: CollaboratorRoles.Owner }),
})
