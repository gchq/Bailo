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

  onViewFiles: vi.fn(),
  onDeleteFile: vi.fn(),
  onCreateFile: vi.fn(),

  onCreateRelease: vi.fn(),
  onViewRelease: vi.fn(),
  onUpdateRelease: vi.fn(),
  onDeleteRelease: vi.fn(),
  onSearchReleases: vi.fn(),

  onCreateAccessRequest: vi.fn(),
  onViewAccessRequest: vi.fn(),
  onUpdateAccessRequest: vi.fn(),
  onDeleteAccessRequest: vi.fn(),
  onSearchAccessRequests: vi.fn(),

  onSearchReviews: vi.fn(),
  onCreateReviewResponse: vi.fn(),

  onCreateSchema: vi.fn(),
  onViewSchema: vi.fn(),
  onDeleteSchema: vi.fn(),
  onSearchSchemas: vi.fn(),

  onViewModelImages: vi.fn(),

  onError: vi.fn(),
}
export default audit
