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
  onViewReleases: vi.fn(),

  onCreateAccessRequest: vi.fn(),
  onViewAccessRequest: vi.fn(),
  onUpdateAccessRequest: vi.fn(),
  onDeleteAccessRequest: vi.fn(),
  onViewAccessRequests: vi.fn(),

  onSearchReviews: vi.fn(),
  onCreateReviewResponse: vi.fn(),

  onCreateSchema: vi.fn(),
  onViewSchema: vi.fn(),
  onUpdateSchema: vi.fn(),
  onDeleteSchema: vi.fn(),
  onSearchSchemas: vi.fn(),

  onCreateInference: vi.fn(),
  onViewInference: vi.fn(),
  onUpdateInference: vi.fn(),
  onViewInferences: vi.fn(),

  onViewModelImages: vi.fn(),

  onCreateS3Export: vi.fn(),

  onCreateCommentResponse: vi.fn(),
  onViewResponses: vi.fn(),
  onUpdateResponse: vi.fn(),

  onError: vi.fn(),
}
export default audit
