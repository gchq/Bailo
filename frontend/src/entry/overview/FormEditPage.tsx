import { ExpandLess, ExpandMore, Menu as MenuIcon } from '@mui/icons-material'
import EditIcon from '@mui/icons-material/Edit'
import HistoryIcon from '@mui/icons-material/History'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import {
  Box,
  Button,
  FormControlLabel,
  FormGroup,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
} from '@mui/material'
import { getChangedFields } from '@rjsf/utils'
import { putEntryCard, useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { postRunSchemaMigration, useGetSchemaMigrations } from 'actions/schemaMigration'
import * as _ from 'lodash-es'
import React, { ChangeEvent, useContext, useEffect, useEffectEvent, useState } from 'react'
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
import { getDisplayFormStats, saveDisplayFormStats } from 'src/storage/userPreferences'
import { KeyedMutator } from 'swr'
import { EntryCardKindLabel, EntryInterface, EntryKind, EntryKindLabel, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'

type FormEditPageProps = {
  entry: EntryInterface
  mutateEntry: KeyedMutator<{ model: EntryInterface }>
}
export default function FormEditPage({ entry, mutateEntry }: FormEditPageProps) {
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

  // For displaying the stats around model information completion
  const [calculateStats, setCalculateStats] = useState(0)
  const [displayFormStats, setDisplayFormStats] = useState(getDisplayFormStats())

  const open = Boolean(anchorEl)

  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } = useGetSchemaMigrations(
    entry.card.schemaId,
  )
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card.schemaId)
  const sendNotification = useNotification()
  const { mutateEntryCardRevisions } = useGetEntryCardRevisions(entry.id)

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
          mutateEntryCardRevisions()
        } else {
          setErrorMessage(res.data)
        }
      }
      setLoading(false)
      setCalculateStats((v) => v + 1)
    }
  }

  function onCancel() {
    if (schema) {
      mutateEntry()
      const steps = getStepsFromSchema(
        schema,
        {},
        ['properties.contacts'],
        entry.card.metadata,
        entry.mirroredCard?.metadata,
      )
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
    if (!entry || !schema) {
      return
    }
    const steps = getStepsFromSchema(
      schema,
      {},
      ['properties.contacts'],
      entry.card.metadata,
      entry.mirroredCard?.metadata || {},
    )
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

  const canBeMigrated = (): boolean => {
    if (entry.kind === EntryKind.MIRRORED_MODEL) {
      return entry.card.schemaId !== entry.mirroredCard?.schemaId
    } else {
      return true
    }
  }

  const handleShowCompletionOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDisplayFormStats(event.target.checked)
    saveDisplayFormStats(event.target.checked)
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
        <Stack spacing={2} sx={{ pb: 2 }}>
          <Box>
            {schemaMigrations.length > 0 && canBeMigrated() && (
              <Restricted action='editEntryCard' fallback={<></>}>
                <Box sx={{ width: 'fit-content' }}>
                  <MessageAlert
                    severity='info'
                    message={
                      entry.kind !== EntryKind.MIRRORED_MODEL
                        ? `There is a migration available for this ${EntryKindLabel[entry.kind]}.`
                        : `The schema ID for the source model does not match this mirrored model's schema ID. It is likely that a migration is needed.`
                    }
                    buttonText='Migrate'
                    buttonAction={() => setMigrationListDialogOpen(true)}
                  />
                </Box>
              </Restricted>
            )}
          </Box>
          {!isEdit && (
            <Stack direction='row' justifyContent='space-between' spacing={1}>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={displayFormStats} onChange={handleShowCompletionOnChange} />}
                  label='Show completion'
                />
              </FormGroup>
              <Stack direction='row' spacing={1}>
                <Restricted
                  action='editEntryCard'
                  fallback={<Button disabled>{`Edit ${EntryCardKindLabel[entry.kind]}`}</Button>}
                >
                  <Button
                    variant='outlined'
                    sx={{ width: 'fit-content' }}
                    onClick={() => {
                      handleActionButtonClose()
                      setIsEdit(!isEdit)
                      setOldSchema(_.cloneDeep(splitSchema))
                    }}
                    data-test='editEntryCardButton'
                    startIcon={<EditIcon fontSize='small' />}
                  >
                    {entry.kind === EntryKind.MIRRORED_MODEL
                      ? 'Add additional information'
                      : `Edit ${EntryCardKindLabel[entry.kind]}`}
                  </Button>
                </Restricted>
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
                    data-test='viewHistoryButton'
                  >
                    <ListItemIcon>
                      <HistoryIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>View History</ListItemText>
                  </MenuItem>
                </Menu>
              </Stack>
            </Stack>
          )}
          {isEdit && (
            <Stack direction='row' spacing={1} justifyContent='space-between'>
              <FormGroup>
                <FormControlLabel
                  control={<Switch checked={displayFormStats} onChange={handleShowCompletionOnChange} />}
                  label='Show completion'
                />
              </FormGroup>
              <SaveAndCancelButtons
                onCancel={onCancel}
                onSubmit={onSubmit}
                openTextInputDialog={() => setJsonUploadDialogOpen(true)}
                loading={loading}
                cancelDataTestId='cancelEditEntryCardButton'
                saveDataTestId='saveEntryCardButton'
              />
            </Stack>
          )}
        </Stack>
        <MessageAlert message={errorMessage} severity='error' />
        <JsonSchemaForm
          splitSchema={splitSchema}
          setSplitSchema={setSplitSchema}
          mirroredModel={entry.kind === EntryKind.MIRRORED_MODEL}
          calculateStats={calculateStats}
          canEdit={isEdit}
          displayStats={displayFormStats}
        />
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
