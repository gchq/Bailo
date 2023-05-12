import Typography from '@mui/material/Typography'
import { omit } from 'lodash-es'
import React, { ReactElement } from 'react'

import { LogEntry } from '../../types/types'

export const miscIgnoreList = [
  '_id',
  'src',
  'time',
  'name',
  'hostname',
  'pid',
  'level',
  'msg',
  'v',
  '__v',
  'createdAt',
  'updatedAt',
]

type MiscLogDetailsProps = {
  log: LogEntry
  indent: number
}

export default function MiscLogDetails({ log, indent }: MiscLogDetailsProps): ReactElement {
  return <Typography sx={{ ml: indent * 6 }}>{JSON.stringify(omit(log, miscIgnoreList), null, 2)}</Typography>
}
