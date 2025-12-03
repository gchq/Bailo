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
import { useGetUsageBySchema } from 'actions/schema'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

type SchemaDialogProps = {
  open: boolean
  schema: SchemaInterface
  onClose: () => void
}

export default function UsageListDialog({ open = false, onClose, schema }: SchemaDialogProps) {
  const {
    data: data,
    isDataLoading: isDataLoading,
    isDataError: isDataError,
  } = useGetUsageBySchema(schema.kind, schema.id)

  const dataList = useMemo(
    () => (
      <List>
        {data.map((item) => (
          <ListItem key={item.id}>
            <Link href={item.href} sx={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton dense aria-label={`go to the ${schema.kind}: ${item.name} `}>
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
                      {item.name}
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
                      {item.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    ),
    [data, schema.kind],
  )

  if (isDataError) {
    return <MessageAlert message={isDataError.info.message} severity='error' />
  }

  if (isDataLoading) {
    return <Loading />
  }

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>{`${camelCaseToTitleCase(schema.kind)}s associated to schema (${data.length})`}</DialogTitle>
      <DialogContent>
        {data.length ? dataList : <EmptyBlob text={`No associated ${camelCaseToTitleCase(schema.kind)}s`} />}
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
