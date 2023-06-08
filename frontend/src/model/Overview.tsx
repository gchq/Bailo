import ModelOverview from 'src/ModelOverview'
import { Version } from 'types/types'

interface Props {
  version: Version
}

export default function Overview({ version }: Props) {
  return <ModelOverview version={version} />
}
