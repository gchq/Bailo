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
import { useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

interface UpdateReviewRolesForSchemaDialogProps {
  open: boolean
  onClose: () => void
  schema: SchemaInterface
}

export default function UpdateReviewRolesForSchemaDialog({
  open,
  onClose,
  schema,
}: UpdateReviewRolesForSchemaDialogProps) {
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()

  const [checked, setChecked] = useState<string[]>(schema.reviewRoles)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [warningDialogMessage, setWarningDialogMessage] = useState('')

  const theme = useTheme()

  useEffect(() => {
    if (schema) {
      setChecked(schema.reviewRoles)
    }
  }, [schema])

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
    schema.reviewRoles.filter((reviewRole) => !checked.includes(reviewRole))
    const res = await patchSchema(schema.id, { reviewRoles: checked })
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      handleOnClose()
      setConfirmationDialogOpen(false)
    }
  }

  const handleOnClose = () => {
    setChecked(schema.reviewRoles)
    onClose()
  }

  const handleOpenDialog = () => {
    setConfirmationDialogOpen(true)
    const removedRoles = schema.reviewRoles.filter((reviewRole) => !checked.includes(reviewRole))
    const addedRoles = checked.filter((checkedRole) => !schema.reviewRoles.includes(checkedRole))
    let warningMessageText = ''
    if (removedRoles.length > 0) {
      warningMessageText += `You are about to remove the following ${plural(removedRoles.length, 'role')} from the schema: ${removedRoles.join(', ')}. Removing roles from a schema will remove those roles from any user currently assigned to any model using that schema. `
    }
    if (addedRoles.length > 0) {
      warningMessageText += `You are about to add the following ${plural(addedRoles.length, 'role')} to the schema: ${addedRoles.join(', ')}. `
    }
    warningMessageText += 'Please confirm below that you are happy with these changes.'
    setWarningDialogMessage(warningMessageText)
  }

  const reviewRoleList = useMemo(
    () =>
      reviewRoles.map((role) => (
        <ListItem key={role.shortName} dense>
          <ListItemButton role={undefined} onClick={handleToggle(role.shortName)} dense>
            <ListItemIcon>
              <Checkbox
                edge='start'
                checked={checked.includes(role.shortName)}
                tabIndex={-1}
                disableRipple
                slotProps={{ input: { 'aria-labelledby': role.shortName } }}
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
        <Button onClick={handleOpenDialog}>Save</Button>
        <Typography variant='caption' color={theme.palette.error.main}>
          {errorMessage}
        </Typography>
        <ConfirmationDialogue
          open={confirmationDialogOpen}
          title='Please read before confirming your changes!'
          dialogMessage={warningDialogMessage}
          onConfirm={handleOnSave}
          onCancel={() => setConfirmationDialogOpen(false)}
        />
      </DialogActions>
    </Dialog>
  )
}
