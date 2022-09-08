import VersionModel from '../models/Version'
import '../utils/mockMongo'
import { testVersion, testVersion2, userDoc } from '../utils/test/testModels'
import {
  createVersion,
  findModelVersions,
  findVersionById,
  findVersionByName,
  serializedVersionFields,
} from './version'

let versionDoc

describe('test version service', () => {
  beforeEach(async () => {
    versionDoc = await VersionModel.create(testVersion)
    await VersionModel.create(testVersion2)
    testVersion._id = versionDoc._id
  })

  test('that the serializer returns the correct properties', () => {
    // Need to improve this by testing an actual log entry to see if it has just the properties below
    const properties: any = serializedVersionFields()
    expect(properties.mandatory).toStrictEqual(['_id', 'version', 'metadata.highLevelDetails.name'])
  })

  test('find version by name/version', async () => {
    const version: any = await findVersionByName(userDoc, versionDoc.model, '1')
    expect(version).toBeTruthy()
    expect(version.version).toBe(testVersion.version)
  })

  test('find version by ID', async () => {
    const version: any = await findVersionById(userDoc, testVersion._id)
    expect(version).toBeTruthy()
    expect(version.version).toBe(testVersion.version)
  })

  test('find versions for model ID', async () => {
    const versions: any = await findModelVersions(userDoc, versionDoc.model)
    expect(versions).toBeTruthy()
    expect(versions.length).toBe(2)
  })

  test('version can be created', async () => {
    const newVersion: any = {
      version: '1',
      metadata: {},
      files: {},
    }
    const version: any = await createVersion(userDoc, newVersion)
    expect(version).toBeTruthy()
    expect(version.version).toBe(newVersion.version)
  })
})
