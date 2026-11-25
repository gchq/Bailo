import { registerPath } from '../../../services/specification.js'
import { getModelsSearch, getModelsSearchPathSpec, getModelsSearchSchema } from '../../v3/model/getModelsSearch.js'

registerPath({ ...getModelsSearchPathSpec, path: '/api/v2/models/search' })

export { getModelsSearch, getModelsSearchSchema }
