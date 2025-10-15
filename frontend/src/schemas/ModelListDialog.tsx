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
import { EntrySearchResult } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { ErrorInfo } from 'utils/fetcher'

type SchemaDialogProps = {
  models: Array<EntrySearchResult>
  isModelsLoading?: boolean
  isModelsError?: ErrorInfo
  open: boolean
  onClose: () => void
}

export default function ModelListDialog({
  models = [],
  isModelsLoading = false,
  isModelsError,
  open = false,
  onClose,
}: SchemaDialogProps) {
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
      <DialogTitle>{`Models associated to schema (${models.length})`}</DialogTitle>
      <DialogContent>
        {isModelsLoading ? <Loading /> : models.length ? modelList : <EmptyBlob text='No Associated Models' />}
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
