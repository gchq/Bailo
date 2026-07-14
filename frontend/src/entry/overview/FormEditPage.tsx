import EditIcon from '@mui/icons-material/Edit'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import HistoryIcon from '@mui/icons-material/History'
import Info from '@mui/icons-material/Info'
import MenuIcon from '@mui/icons-material/Menu'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { getChangedFields } from '@rjsf/utils'
import { putEntryCard, useGetEntryCardRevisions } from 'actions/modelCard'
import { useGetSchema } from 'actions/schema'
import { postRunSchemaMigration, useGetSchemaMigrations } from 'actions/schemaMigration'
import { useGetUiConfig } from 'actions/uiConfig'
import * as _ from 'lodash-es'
import { useRouter } from 'next/router'
import React, { ChangeEvent, useContext, useEffect, useEffectEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import TextInputDialog from 'src/common/TextInputDialog'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import EntryCardHistoryDialog from 'src/entry/overview/EntryCardHistoryDialog'
import ExportEntryCardDialog from 'src/entry/overview/ExportEntryCardDialog'
import ImportModelCardTextDialog from 'src/entry/overview/ImportModelCardTextDialog'
import MigrationListDialog from 'src/entry/overview/MigrationListDialog'
import SaveAndCancelButtons from 'src/entry/overview/SaveAndCancelFormButtons'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import InformationDialog from 'src/schemas/InformationDialog'
import { getDisplayFormStats, saveDisplayFormStats } from 'src/storage/userPreferences'
import { KeyedMutator } from 'swr'
import { EntryCardKindLabel, EntryInterface, EntryKind, EntryKindLabel, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema } from 'utils/formUtils'

type FormEditPageProps = {
  entry: EntryInterface
  mutateEntry: KeyedMutator<{ model: EntryInterface }>
}

export type RouterQueryParams = {
  page?: number
  requiredByModelState?: string
  isEdit?: boolean
}

export default function FormEditPage({ entry, mutateEntry }: FormEditPageProps) {
  const router = useRouter()
  const { userPermissions } = useContext(UserPermissionsContext)

  const isEdit = useMemo(
    () => router.query.isEdit === 'true' && userPermissions.editEntryCard.hasPermission,
    [router.query.isEdit, userPermissions.editEntryCard.hasPermission],
  )

  const [oldSchema, setOldSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorMessage, setErrorMessage] = useState('')
  const [migrationErrorMessage, setMigrationErrorMessage] = useState('')
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [jsonUploadDialogOpen, setJsonUploadDialogOpen] = useState(false)
  const [importTextDialogOpen, setImportTextDialogOpen] = useState(false)
  const [migrationListDialogOpen, setMigrationListDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [SchemaInformationOpen, setSchemaInformationOpen] = useState(false)

  // For displaying the stats around model information completion
  const [calculateStats, setCalculateStats] = useState(0)
  const [displayFormStats, setDisplayFormStats] = useState(getDisplayFormStats())

  const open = Boolean(anchorEl)

  const { schemaMigrations, isSchemaMigrationsLoading, isSchemaMigrationsError } = useGetSchemaMigrations(
    entry.card.schemaId,
  )
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(entry.card.schemaId, entry.state)
  const { uiConfig } = useGetUiConfig()
  const sendNotification = useNotification()
  const { mutateEntryCardRevisions } = useGetEntryCardRevisions(entry.id)

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: schema ? schema.id : '', steps: [] })

  const updateSplitSchema = useEffectEvent((newValue: SplitSchemaNoRender) => {
    setSplitSchema(newValue)
  })

  useEffect(() => {
    if (schema) {
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
      updateSplitSchema({ reference: schema ? schema.id : '', steps })
    }
  }, [entry.card.metadata, entry.mirroredCard?.metadata, schema])

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
        handleChangeEditMode(false)
      } else {
        const res = await putEntryCard(entry.id, data)
        if (res.status && res.status < 400) {
          handleChangeEditMode(false)
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
      handleChangeEditMode(false)
    }
  }

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

  function handleImportTextOnSubmit(metadata: Record<string, unknown>, warnings: string[]) {
    setImportTextDialogOpen(false)
    try {
      if (schema) {
        const steps = getStepsFromSchema(schema, {}, [], metadata)
        for (const step of steps) {
          step.steps = steps
        }
        setSplitSchema({ reference: schema.id, steps })
        sendNotification({
          variant: 'success',
          msg:
            warnings.length > 0
              ? `Model card data imported with ${warnings.length} validation warning(s):\n${warnings.map((warning) => `- ${warning}`).join('\n')}`
              : 'Model card data imported successfully. Please review the extracted fields.',
          anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
        })
      }
    } catch (_e) {
      sendNotification({
        variant: 'error',
        msg: 'Could not populate form with imported data',
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

  function handleChangeEditMode(isEdit: boolean) {
    router.replace({
      query: { ...router.query, isEdit },
    })
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
      <Box>
        <Stack spacing={2} sx={{ pb: 2 }}>
          <Box>
            {schemaMigrations.length > 0 && canBeMigrated() && (
              <Restricted action='editEntryCard' fallback={<></>}>
                <Box sx={{ width: 'fit-content' }}>
                  <MessageAlert
                    severity='info'
                    style={{ my: 0 }}
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
            <Stack direction={{ sm: 'row', xs: 'column' }} sx={{ justifyContent: 'space-between' }} spacing={1}>
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                sx={{ alignItems: 'center' }}
                spacing={2}
                divider={<Divider flexItem orientation='vertical' />}
              >
                {schema && (
                  <Stack>
                    <Typography variant='caption' sx={{ fontWeight: 'bold' }} color='primary'>
                      Schema:
                    </Typography>
                    <Stack direction='row' sx={{ alignItems: 'center' }}>
                      <Typography variant='caption'>{schema.name}</Typography>
                      <IconButton onClick={() => setSchemaInformationOpen(true)}>
                        <Info color='primary' fontSize='small' />
                      </IconButton>
                      <InformationDialog
                        open={SchemaInformationOpen}
                        schema={schema}
                        onClose={() => setSchemaInformationOpen(false)}
                      />
                    </Stack>
                  </Stack>
                )}
                <FormGroup>
                  <FormControlLabel
                    control={<Switch checked={displayFormStats} onChange={handleShowCompletionOnChange} />}
                    label='Show completion'
                  />
                </FormGroup>
              </Stack>
              <Stack direction='row' spacing={1}>
                <Restricted
                  action='editEntryCard'
                  fallback={<Button disabled>{`Edit ${EntryCardKindLabel[entry.kind]}`}</Button>}
                >
                  <Button
                    variant='outlined'
                    sx={{ width: 'fit-content', height: 'fit-content' }}
                    onClick={() => {
                      handleActionButtonClose()
                      handleChangeEditMode(!isEdit)
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
                  sx={{ height: 'fit-content' }}
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
            <Stack
              direction='row'
              spacing={1}
              sx={{
                justifyContent: 'space-between',
              }}
            >
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
                openImportTextDialog={() => setImportTextDialogOpen(true)}
                showImportFromText={!!uiConfig?.llmImport?.enabled}
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
          stateList={(schema?.jsonSchema as { stateList?: string[] } | undefined)?.stateList || []}
        />
        {isEdit && (
          <SaveAndCancelButtons
            onCancel={onCancel}
            onSubmit={onSubmit}
            loading={loading}
            openTextInputDialog={() => setJsonUploadDialogOpen(true)}
            openImportTextDialog={() => setImportTextDialogOpen(true)}
            showImportFromText={!!uiConfig?.llmImport?.enabled}
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
      <ImportModelCardTextDialog
        open={importTextDialogOpen}
        onClose={() => setImportTextDialogOpen(false)}
        onSubmit={handleImportTextOnSubmit}
        modelId={entry.id}
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
