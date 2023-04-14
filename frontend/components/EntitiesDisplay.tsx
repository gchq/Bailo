import { Entity } from '@bailo/shared/types'
import EntityDisplay from './EntityDisplay'

interface Props {
  entities: Array<Entity>
}

export default function EntitiesDisplay({ entities }: Props) {
  return <>{entities.map((entity, i) => [i > 0 && ', ', <EntityDisplay key={i} entity={entity} />])}</>
}
