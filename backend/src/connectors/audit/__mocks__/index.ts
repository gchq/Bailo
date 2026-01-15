import { vi } from 'vitest'

const audit = {
  onCreateModel: vi.fn(),
  onViewModel: vi.fn(),
  onSearchModel: vi.fn(),
  onUpdateModel: vi.fn(),
  onDeleteModel: vi.fn(),

  onCreateModelCard: vi.fn(),
  onViewModelCard: vi.fn(),
  onViewModelCardRevisions: vi.fn(),
  onUpdateModelCard: vi.fn(),

  onCreateFile: vi.fn(),
  onViewFiles: vi.fn(),
  onUpdateFile: vi.fn(),
  onDeleteFile: vi.fn(),

  onCreateRelease: vi.fn(),
  onViewRelease: vi.fn(),
  onViewReleases: vi.fn(),
  onUpdateRelease: vi.fn(),
  onDeleteRelease: vi.fn(),

  onCreateReviewResponse: vi.fn(),

  onCreateAccessRequest: vi.fn(),
  onViewAccessRequest: vi.fn(),
  onViewAccessRequests: vi.fn(),
  onUpdateAccessRequest: vi.fn(),
  onDeleteAccessRequest: vi.fn(),

  onSearchReviews: vi.fn(),

  onCreateSchema: vi.fn(),
  onViewSchema: vi.fn(),
  onSearchSchemas: vi.fn(),
  onUpdateSchema: vi.fn(),
  onDeleteSchema: vi.fn(),

  onCreateSchemaMigration: vi.fn(),
  onViewSchemaMigration: vi.fn(),
  onViewSchemaMigrations: vi.fn(),
  onUpdateSchemaMigration: vi.fn(),

  onCreateInference: vi.fn(),
  onViewInference: vi.fn(),
  onViewInferences: vi.fn(),
  onUpdateInference: vi.fn(),
  onDeleteInference: vi.fn(),

  onViewModelImages: vi.fn(),
  onDeleteImage: vi.fn(),

  onCreateS3Export: vi.fn(),
  onCreateImport: vi.fn(),

  onCreateCommentResponse: vi.fn(),
  onViewResponses: vi.fn(),
  onUpdateResponse: vi.fn(),

  onCreateReviewRole: vi.fn(),
  onViewReviewRoles: vi.fn(),
  onUpdateReviewRole: vi.fn(),
  onDeleteReviewRole: vi.fn(),

  onError: vi.fn(),
}
export default audit
