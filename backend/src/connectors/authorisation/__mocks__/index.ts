import { vi } from 'vitest'

const auth = {
  hasModelVisibilityAccess: vi.fn(() => true),
  hasAccessRequest: vi.fn(() => true),

  model: vi.fn(() => ({ success: true })),
  models: vi.fn(() => [{ success: true }]),

  schema: vi.fn(() => ({ success: true })),
  schemas: vi.fn(() => [{ success: true }]),

  accessRequest: vi.fn(() => ({ success: true })),
  accessRequests: vi.fn(() => [{ success: true }]),

  release: vi.fn(() => ({ success: true })),
  releases: vi.fn(() => [{ success: true }]),

  file: vi.fn(() => ({ success: true })),
  files: vi.fn(() => [{ success: true }]),

  image: vi.fn(() => ({ success: true })),
  images: vi.fn(() => [{ success: true }]),
}

export default auth
