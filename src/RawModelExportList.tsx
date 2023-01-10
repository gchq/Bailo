import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { useGetModelById, useGetModelVersions } from '../data/model'
import { Deployment } from '../types/interfaces'
import { ModelDoc } from '../server/models/Model'
import EmptyBlob from './common/EmptyBlob'
import RawModelExportItem from './RawModelExportItem'

function RawModelExportList({ deployment }: { deployment: Deployment }) {
  const modelFromDeployment: ModelDoc = deployment.model as ModelDoc
  const { model } = useGetModelById(modelFromDeployment._id.toString())
  const { versions } = useGetModelVersions(model?.uuid)

  return (
    <>
      {versions &&
        versions.map((version: any, index: number) => (
          <>
            <RawModelExportItem
              deploymentUuid={`${deployment.uuid}`}
              version={version.version}
              uploadType={version.metadata.buildOptions.uploadType}
              key={version.version}
            />
            {index < versions.length - 1 && (
              <Box sx={{ px: 1 }}>
                <Divider orientation='horizontal' />
              </Box>
            )}
          </>
        ))}
      {versions && versions.length === 0 && <EmptyBlob text='No exportable versions' />}
    </>
  )
}

export default RawModelExportList
