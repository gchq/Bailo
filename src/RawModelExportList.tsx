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
        versions.map((version: any) => (
          <RawModelExportItem deploymentUuid={`${deployment.uuid}`} version={version.version} key={version.version} />
        ))}
      {versions && versions.length === 0 && <EmptyBlob text='No exportable versions' />}
    </>
  )
}

export default RawModelExportList
