import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { useListModels } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, SchemaInterface, SchemaKind } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function EntryListDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  const {
    models: entries,
    isModelsLoading: isEntriesLoading,
    isModelsError: isEntriesError,
  } = useListModels(
    schema.kind === SchemaKind.DATA_CARD ? EntryKind.DATA_CARD : EntryKind.MODEL,
    [],
    '',
    [],
    [],
    [],
    '',
    undefined,
    schema.id,
  )

  const entryList = useMemo(
    () => (
      <List>
        {entries.map((entry) => (
          <ListItem key={entry.id}>
            <Link href={`/model/${entry.id}`} sx={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton dense aria-label={`go to the ${schema.kind}: ${entry.name} `}>
                <ListItemText
                  primary={
                    <Typography
                      variant='h6'
                      component='h4'
                      color='primary'
                      sx={{
                        fontWeight: '500',
                        textDecoration: 'none',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant='body1'
                      color='textSecondary'
                      sx={{
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    ),
    [entries, schema.kind],
  )

  if (isEntriesError) {
    return <MessageAlert message={isEntriesError.info.message} severity='error' />
  }

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>{`${camelCaseToTitleCase(schema.kind)}s associated to schema (${entries.length})`}</DialogTitle>
      <DialogContent>
        {isEntriesLoading ? (
          <Loading />
        ) : entries.length ? (
          entryList
        ) : (
          <EmptyBlob text={`No associated ${camelCaseToTitleCase(schema.kind)}s`} />
        )}
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
