import { castArray, get, pick, set } from 'lodash-es'

export interface SerializerOptions {
  mandatory?: Array<string>
  optional?: Array<string>
  serializable?: Array<any>
}

export function createSerializer(options: SerializerOptions) {
  const mandatory = options.mandatory || []
  const optional = options.optional || []
  const serializable = options.serializable || []

  return function serializer(unserialized: unknown) {
    if (!unserialized) {
      return unserialized
    }

    const asArray = castArray(unserialized)

    if (!asArray.every((item) => mandatory.every((value) => get(item, value) !== undefined))) {
      return unserialized
    }

    const serialized = asArray.map((item) => {
      const segments = pick(item, mandatory.concat(optional))
      const remotes = {}

      serializable.forEach(({ type, field }) => {
        set(remotes, field, type(get(item, field)))
      })

      return { ...segments, ...remotes }
    })

    return Array.isArray(unserialized) ? serialized : serialized[0]
  }
}

export function serializedDeploymentFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'name'],
    optional: [],
    serializable: [],
  }
}

export function serializedModelFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'uuid', 'latestVersion.metadata.highLevelDetails.name', 'schemaRef'],
  }
}

export function serializedVersionFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'version', 'metadata.highLevelDetails.name'],
    optional: [],
    serializable: [{ type: createSerializer(serializedModelFields()), field: 'model' }],
  }
}

export function serializedSchemaFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'reference', 'name', 'use'],
  }
}

export function serializedUserFields(): SerializerOptions {
  return {
    mandatory: ['_id', 'id', 'email'],
  }
}

const serializers = {
  version: createSerializer(serializedVersionFields()),
  versions: createSerializer(serializedVersionFields()),
  model: createSerializer(serializedModelFields()),
  models: createSerializer(serializedModelFields()),
  deployment: createSerializer(serializedDeploymentFields()),
  deployments: createSerializer(serializedDeploymentFields()),
  schema: createSerializer(serializedSchemaFields()),
  schemas: createSerializer(serializedSchemaFields()),
  user: createSerializer(serializedUserFields()),
  users: createSerializer(serializedUserFields()),
}

export default serializers
