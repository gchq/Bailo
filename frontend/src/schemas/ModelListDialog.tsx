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
import { EntryKind, SchemaInterface } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function EntryListDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  //TODO changes to this as blocked as no accessrequest endpoint
  const { models, isModelsLoading, isModelsError } = useListModels(
    schema.kind === 'dataCard' ? EntryKind.DATA_CARD : EntryKind.MODEL,
    [],
    '',
    [],
    [],
    [],
    '',
    undefined,
    schema.id,
  )

  const modelList = useMemo(
    () => (
      <List>
        {models.map((model) => (
          <ListItem key={model.id}>
            <Link href={`/model/${model.id}`} sx={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton dense aria-label={`go to the model: ${model.name} `}>
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
                      {model.name}
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
                      {model.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    ),
    [models],
  )

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>{`${camelCaseToTitleCase(schema.kind)}s associated to schema (${models.length})`}</DialogTitle>
      <DialogContent>
        {isModelsLoading ? (
          <Loading />
        ) : models.length ? (
          modelList
        ) : (
          <EmptyBlob text={`No Associated ${camelCaseToTitleCase(schema.kind)}s`} />
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
