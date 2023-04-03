import { DocFileOrHeading, DocHeading } from '../../../lib/shared/types'

const isDocHeading = (obj: DocFileOrHeading): obj is DocHeading => !!(obj as DocHeading).children

export default isDocHeading
