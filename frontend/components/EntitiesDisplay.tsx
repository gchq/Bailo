import { Entity } from '../src/MuiForms/EntitySelector'
import EntityDisplay from './EntityDisplay'

interface Props {
  entities: Array<Entity>
}

export default function EntitiesDisplay({ entities }: Props) {
  return <>{entities.map((entity, i) => [i > 0 && ', ', <EntityDisplay key={i} entity={entity} />])}</>
}
