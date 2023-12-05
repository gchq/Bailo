import { EntityObject } from '../types/v2/types'
import EntityDisplay from './EntityDisplay'

interface Props {
  entities: Array<EntityObject>
}

export default function EntitiesDisplay({ entities }: Props) {
  return <>{entities.map((entity, i) => [i > 0 && ', ', <EntityDisplay key={i} entity={entity} />])}</>
}
