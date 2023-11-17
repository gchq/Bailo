import { vi } from 'vitest'

const audit = {
  onCreateModel: vi.fn(),
  onViewModel: vi.fn(),
  onUpdateModel: vi.fn(),
  onSearchModel: vi.fn(),

  onCreateModelCard: vi.fn(),
  onViewModelCard: vi.fn(),
  onViewModelCardRevisions: vi.fn(),
  onUpdateModelCard: vi.fn(),

  onCreateAccessRequest: vi.fn(),
  onViewAccessRequest: vi.fn(),
  onUpdateAccessRequest: vi.fn(),
  onDeleteAccessRequest: vi.fn(),
  onSearchAccessRequests: vi.fn(),

  onError: vi.fn(),
}
export default audit
