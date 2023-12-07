import { vi } from 'vitest'

const auth = {
  hasModelVisibilityAccess: vi.fn(() => true),
  hasAccessRequest: vi.fn(() => true),

  model: vi.fn(() => ({ success: true })),
  modelBatch: vi.fn(() => [{ success: true }]),

  schema: vi.fn(() => ({ success: true })),
  schemaBatch: vi.fn(() => [{ success: true }]),

  accessRequest: vi.fn(() => ({ success: true })),
  accessRequestBatch: vi.fn(() => [{ success: true }]),

  release: vi.fn(() => ({ success: true })),
  releaseBatch: vi.fn(() => [{ success: true }]),

  file: vi.fn(() => ({ success: true })),
  fileBatch: vi.fn(() => [{ success: true }]),

  image: vi.fn(() => ({ success: true })),
  imageBatch: vi.fn(() => [{ success: true }]),
}

export default auth
