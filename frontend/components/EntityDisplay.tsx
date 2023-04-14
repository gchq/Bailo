import { Entity } from '@bailo/shared/types'

interface Props {
  entity: Entity
}

export default function EntityDisplay({ entity }: Props) {
  // To ensure future compatability, remember to include a default case
  // for all future 'entity.kind' values.  The 'id' will always include a
  // reasonable display value.
  return <>{entity.id}</>
}
