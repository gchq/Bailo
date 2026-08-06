import { createContext } from 'react'
import { ScanInfoInterface } from 'types/types'

const ArtefactScanningInfoContext = createContext<ScanInfoInterface[]>([])

export default ArtefactScanningInfoContext
