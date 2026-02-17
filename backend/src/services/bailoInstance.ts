/**
 * Service for CRUD of Allowed Bailo instances.
 */

import BailoInstanceModel from '../models/BailoInstance.js'

export async function findAllowedBailoInstances() {
  return BailoInstanceModel.find()
}

export async function createAllowedBailoInstance(instanceId: string, userIds: string[]): Promise<string> {
  const newBailoInstance = await BailoInstanceModel.create({
    instanceId,
    userIds,
  })

  return newBailoInstance._id.toString()
}

export async function updateAllowedBailoInstance(
  id: string,
  update: {
    instanceId?: string
    userIds?: string[]
  },
) {
  const instance = await BailoInstanceModel.findByIdAndUpdate(id, { $set: update }, { new: true })

  if (!instance) {
    throw new Error(`BailoInstance not found: ${id}`)
  }

  return instance
}

export async function deleteAllowedBailoInstance(id: string): Promise<void> {
  const instance = await BailoInstanceModel.findById(id)

  if (!instance) {
    throw new Error(`BailoInstance not found: ${id}`)
  }

  await instance.delete()
}
