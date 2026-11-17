import { registerPath } from '../../../services/specification.js'
import { getModelsSearch, getModelsSearchPathSpec, getModelsSearchSchema } from '../../v3/model/getModelsSearch.js'

registerPath({
  ...getModelsSearchPathSpec,
  deprecated: true,
  description: 'Deprecated: use /api/v3/models/search. The titleOnly option is ignored.',
  path: '/api/v2/models/search',
})

export { getModelsSearch, getModelsSearchSchema }
