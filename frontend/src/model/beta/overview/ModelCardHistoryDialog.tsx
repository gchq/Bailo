import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import List from '@mui/material/List'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import { useMemo } from 'react'

import { useModelCardRevisions } from '../../../../actions/modelCard'
import Loading from '../../../../src/common/Loading'
import MessageAlert from '../../../../src/MessageAlert'
import { ModelInterface } from '../../../../types/v2/types'
import { sortByCreatedAtDescending } from '../../../../utils/dateUtils'
import ModelCardRevisionListDisplay from './ModelCardRevisionListDisplay'

type DialogProps = {
  model: ModelInterface
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function ViewModelCardHistoryDialog({
  model,

  open,
  setOpen,
}: DialogProps) {
  const theme = useTheme()
  const { modelCardRevisions, isModelCardRevisionsLoading, isModelCardRevisionsError } = useModelCardRevisions(model.id)
  const sortedModelCardRevisions = useMemo(
    () => modelCardRevisions.sort(sortByCreatedAtDescending),
    [modelCardRevisions],
  )

  if (isModelCardRevisionsError) {
    return <MessageAlert message={isModelCardRevisionsError.info.message} severity='error' />
  }

  return (
    <>
      {isModelCardRevisionsLoading && <Loading />}
      <ThemeProvider theme={theme}>
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
          <DialogTitle>
            History details for <span style={{ color: theme.palette.primary.main }}>{model.name}</span>
          </DialogTitle>
          <DialogContent>
            <List>
              {sortedModelCardRevisions.map((modelCardRevision) => (
                <ModelCardRevisionListDisplay key={model.id} modelCard={modelCardRevision} />
              ))}
            </List>
          </DialogContent>

          <DialogActions>
            <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </>
  )
}
