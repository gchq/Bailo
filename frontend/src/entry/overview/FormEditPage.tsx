import { ExpandLess, ExpandMore, Menu as MenuIcon } from '@mui/icons-material'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { getChangedFields } from '@rjsf/utils'
import { putEntryCard } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { postRunSchemaMigration, useGetSchemaMigrations } from 'actions/schemaMigration'
import * as _ from 'lodash-es'
import React, { useContext, useEffect, useEffectEvent, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import TextInputDialog from 'src/common/TextInputDialog'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import EntryCardHistoryDialog from 'src/entry/overview/EntryCardHistoryDialog'
import ExportEntryCardDialog from 'src/entry/overview/ExportEntryCardDialog'
import MigrationListDialog from 'src/entry/overview/MigrationListDialog'
import SaveAndCancelButtons from 'src/entry/overview/SaveAndCancelFormButtons'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr'
import { EntryCardKindLabel, EntryInterface, EntryKind, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'
type FormEditPageProps = {
  entry: EntryInterface
  readOnly?: boolean
  mutateEntry: KeyedMutator<{ model: EntryInterface }>
}
export default function FormEditPage({ entry, readOnly = false, mutateEntry }: FormEditPageProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [oldSchema, setOldSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorMessage, setErrorMessage] = useState('')
  const [migrationErrorMessage, setMigrationErrorMessage] = useState('')
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [jsonUploadDialogOpen, setJsonUploadDialogOpen] = useState(false)
  const [migrationListDialogOpen, setMigrationListDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } = useGetSchemaMigrations(
    entry.card.schemaId,
  )
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card.schemaId)
  const sendNotification = useNotification()

  function handleActionButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }

  const handleActionButtonClose = () => {
    setAnchorEl(null)
  }
  const { setUnsavedChanges } = useContext(UnsavedChangesContext)

  async function onSubmit() {
    if (schema) {
      setErrorMessage('')
      setLoading(true)
      const oldData = getStepsData(oldSchema, true)
      const data = getStepsData(splitSchema, true)

      if (getChangedFields(oldData, data).length === 0) {
        setIsEdit(false)
      } else {
        const res = await putEntryCard(entry.id, data)
        if (res.status && res.status < 400) {
          setIsEdit(false)
        } else {
          setErrorMessage(res.data)
        }
      }
      setLoading(false)
    }
  }

  function onCancel() {
    if (schema) {
      mutateEntry()
      const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], entry.card.metadata)
      for (const step of steps) {
        step.steps = steps
      }
      setSplitSchema({ reference: schema.id, steps })
      setIsEdit(false)
    }
  }

  const onSplitSchemaChange = useEffectEvent((newSplitSchema: SplitSchemaNoRender) => {
    setSplitSchema(newSplitSchema)
  })

  useEffect(() => {
    if (!entry || !schema) return
    const metadata = entry.card.metadata
    const steps = getStepsFromSchema(schema, {}, ['properties.contacts'], metadata)
    for (const step of steps) {
      step.steps = steps
    }
    onSplitSchemaChange({ reference: schema.id, steps })
  }, [schema, entry])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  function handleJsonFormOnSubmit(formData: string) {
    setJsonUploadDialogOpen(false)
    try {
      if (schema) {
        const steps = getStepsFromSchema(schema, {}, [], JSON.parse(formData))
        for (const step of steps) {
          step.steps = steps
        }
        setSplitSchema({ reference: schema.id, steps })
      }
    } catch (_e) {
      sendNotification({
        variant: 'error',
        msg: 'Could not update form - please make sure to use valid JSON',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  const handleMigrationConfirm = async (selectedMigrationPlan: string) => {
    setMigrationErrorMessage('')
    if (!selectedMigrationPlan) {
      return setMigrationErrorMessage('Invalid schema migration plan selected')
    }
    const res = await postRunSchemaMigration(entry.id, selectedMigrationPlan)
    if (!res.ok) {
      setMigrationErrorMessage(await getErrorMessage(res))
    } else {
      mutateEntry()
      setMigrationListDialogOpen(false)
      sendNotification({
        variant: 'success',
        msg: 'Schema successfully migrated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isSchemaMigrationsError) {
    return <MessageAlert message={isSchemaMigrationsError.info.message} severity='error' />
  }

  if (isSchemaMigrationsLoading || isSchemaLoading) {
    return <Loading />
  }

  return (
    <>
      <Box sx={{ py: 1 }}>
        <Stack
          direction={{ sm: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems='center'
          spacing={2}
          sx={{ pb: 2 }}
        >
          <div>
            <Typography fontWeight='bold'>Schema</Typography>
            <Stack direction='row' alignItems='center'>
              <Typography>{schema?.name}</Typography>
              <CopyToClipboardButton
                textToCopy={schema ? schema.name : ''}
                notificationText='Copied schema name to clipboard'
                ariaLabel='copy schema name to clipboard'
              />
            </Stack>
          </div>
          {schemaMigrations.length > 0 && entry.kind !== EntryKind.MIRRORED_MODEL && (
            <Restricted
              action='editEntryCard'
              fallback={<Button disabled>{`Edit ${EntryCardKindLabel[entry.kind]}`}</Button>}
            >
              <MessageAlert
                severity='info'
                message='There is a migration available for this model'
                buttonText='Migrate'
                buttonAction={() => setMigrationListDialogOpen(true)}
              />
            </Restricted>
          )}
          {!isEdit && (
            <Stack direction='row' spacing={1}>
              {!readOnly && (
                <Restricted
                  action='editEntryCard'
                  fallback={<Button disabled>{`Edit ${EntryCardKindLabel[entry.kind]}`}</Button>}
                >
                  <Button
                    variant='outlined'
                    onClick={() => {
                      handleActionButtonClose()
                      setIsEdit(!isEdit)
                      setOldSchema(_.cloneDeep(splitSchema))
                    }}
                    data-test='editEntryCardButton'
                    startIcon={<EditIcon fontSize='small' />}
                  >
                    {`Edit ${EntryCardKindLabel[entry.kind]}`}
                  </Button>
                </Restricted>
              )}
              <Button
                startIcon={<MenuIcon />}
                endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                data-test='openEntryOverviewActions'
                variant='contained'
                onClick={handleActionButtonClick}
              >
                More
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleActionButtonClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem
                  onClick={() => {
                    handleActionButtonClose()
                    setExportDialogOpen(true)
                  }}
                >
                  <ListItemIcon>
                    <PictureAsPdfIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Export as PDF</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleActionButtonClose()
                    setHistoryDialogOpen(true)
                  }}
                >
                  <ListItemIcon>
                    <HistoryIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>View History</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>
          )}
          {isEdit && (
            <SaveAndCancelButtons
              onCancel={onCancel}
              onSubmit={onSubmit}
              openTextInputDialog={() => setJsonUploadDialogOpen(true)}
              loading={loading}
              cancelDataTestId='cancelEditEntryCardButton'
              saveDataTestId='saveEntryCardButton'
            />
          )}
        </Stack>
        <MessageAlert message={errorMessage} severity='error' />
        <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={isEdit} />
        {isEdit && (
          <SaveAndCancelButtons
            onCancel={onCancel}
            onSubmit={onSubmit}
            loading={loading}
            openTextInputDialog={() => setJsonUploadDialogOpen(true)}
          />
        )}
      </Box>
      {historyDialogOpen && <EntryCardHistoryDialog entry={entry} setOpen={setHistoryDialogOpen} />}
      <TextInputDialog
        open={jsonUploadDialogOpen}
        onClose={() => setJsonUploadDialogOpen(false)}
        onSubmit={handleJsonFormOnSubmit}
        helperText={`Paste in raw JSON to fill in the ${EntryCardKindLabel[entry.kind]} form`}
        dialogTitle='Add Raw JSON to Form'
      />
      <ExportEntryCardDialog
        entry={entry}
        splitSchema={splitSchema}
        open={exportDialogOpen}
        setOpen={setExportDialogOpen}
      />
      <MigrationListDialog
        open={migrationListDialogOpen}
        onCancel={() => setMigrationListDialogOpen(false)}
        migrations={schemaMigrations}
        errorText={migrationErrorMessage}
        onConfirmation={handleMigrationConfirm}
      />
    </>
  )
}
