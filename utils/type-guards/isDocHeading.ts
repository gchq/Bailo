import { DocFileOrHeading, DocHeading } from '../../types/interfaces.js'

const isDocHeading = (obj: DocFileOrHeading): obj is DocHeading => !!(obj as DocHeading).children

export default isDocHeading
