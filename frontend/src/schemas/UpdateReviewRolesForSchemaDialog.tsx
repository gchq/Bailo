import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { patchSchema } from 'actions/schema'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface UpdateReviewRolesForSchemaDialogProps {
  open: boolean
  onClose: (value: boolean) => void
  schema: SchemaInterface
  mutateSchemas: () => void
}

export default function UpdateReviewRolesForSchemaDialog({
  open,
  onClose,
  schema,
  mutateSchemas,
}: UpdateReviewRolesForSchemaDialogProps) {
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()

  const [checked, setChecked] = useState<string[]>(schema.reviewRoles)
  const [errorMessage, setErrorMessage] = useState('')

  const theme = useTheme()

  const handleToggle = useCallback(
    (value: string) => () => {
      if (checked.includes(value)) {
        setChecked(checked.filter((existingItem) => existingItem !== value))
      } else {
        setChecked([...checked, value])
      }
    },
    [checked],
  )

  const handleOnSave = async () => {
    const res = await patchSchema(schema.id, { reviewRoles: checked })
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateSchemas()
      handleOnClose()
    }
  }

  const handleOnClose = () => {
    setChecked(schema.reviewRoles)
    onClose(false)
  }

  const reviewRoleList = useMemo(
    () =>
      reviewRoles.map((role) => (
        <ListItem key={role.short} dense>
          <ListItemButton role={undefined} onClick={handleToggle(role.short)} dense>
            <ListItemIcon>
              <Checkbox
                edge='start'
                checked={checked.includes(role.short)}
                tabIndex={-1}
                disableRipple
                slotProps={{ input: { 'aria-labelledby': role.short } }}
              />
            </ListItemIcon>
            <ListItemText primary={role.name} secondary={role.description} />
          </ListItemButton>
        </ListItem>
      )),
    [reviewRoles, checked, handleToggle],
  )

  if (isReviewRolesError) {
    return <MessageAlert message={isReviewRolesError.info.message} severity='error' />
  }

  if (isReviewRolesLoading) {
    return <Loading />
  }

  return (
    <Dialog open={open} onClose={handleOnClose}>
      <DialogTitle>Update Review Roles</DialogTitle>
      <DialogContent>
        <List>{reviewRoleList}</List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleOnSave}>Save</Button>
        <Typography variant='caption' color={theme.palette.error.main}>
          {errorMessage}
        </Typography>
      </DialogActions>
    </Dialog>
  )
}
