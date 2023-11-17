import { vi } from 'vitest'

const audit = {
  onCreateAccessRequest: vi.fn(),
  onViewAccessRequest: vi.fn(),
  onUpdateAccessRequest: vi.fn(),
  onDeleteAccessRequest: vi.fn(),
  onSearchAccessRequests: vi.fn(),

  onError: vi.fn(),
}
export default audit
