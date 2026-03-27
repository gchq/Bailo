import { describe, expect, test, vi } from 'vitest'

import { createFilePath, isFileInterfaceDoc } from '../../src/utils/fileUtils.js'

vi.mock('../../src/utils/mongo.js', () => ({
  isHydratedMongoDoc: vi.fn(() => true),
}))

describe('utils > array', () => {
  test('createFilePath', () => {
    expect(createFilePath('model123', 'file123')).toStrictEqual(`beta/model/model123/files/file123`)
    expect(createFilePath('', '')).toStrictEqual(`beta/model//files/`)
  })

  test('isFileInterfaceDoc > success', async () => {
    const result = isFileInterfaceDoc({
      modelId: '',
      name: '',
      size: 1,
      mime: '',
      bucket: '',
      path: '',
      complete: true,
      deleted: false,
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(true)
  })

  test('isFileInterfaceDoc > missing property', async () => {
    const result = isFileInterfaceDoc({
      modelId: '',
      name: '',
      mime: '',
      path: '',
      complete: true,
      deleted: false,
      createdAt: '',
      updatedAt: '',
      _id: '',
    })

    expect(result).toBe(false)
  })

  test('isFileInterfaceDoc > wrong type', async () => {
    const result = isFileInterfaceDoc(null)

    expect(result).toBe(false)
  })
})
