import { EntityObject } from '../types/v2/types'

interface Props {
  entity: EntityObject
}

export default function EntityDisplay({ entity }: Props) {
  // To ensure future compatability, remember to include a default case
  // for all future 'entity.kind' values.  The 'id' will always include a
  // reasonable display value.
  return <>{entity.id}</>
}
