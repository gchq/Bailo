import { Close, ExpandMore } from '@mui/icons-material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Grid,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import { useTheme } from '@mui/material/styles'
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import JsonSchemaViewer, { QuestionSelection } from 'src/Form/JsonSchemaViewer'
import { CombinedSchema, QuestionMigration } from 'types/types'
import { truncateText } from 'utils/stringUtils'

interface SchemaMigratorProps {
  sourceSchema: CombinedSchema
  targetSchema: CombinedSchema
  questionMigrations: QuestionMigration[]
  setQuestionMigrations: Dispatch<SetStateAction<QuestionMigration[]>>
  handleSubmitMigrationPlan: (draft: boolean) => void
  submitErrorText: string
  migrationName: string
  setMigrationName: Dispatch<SetStateAction<string>>
  migrationDescription: string
  setMigrationDescription: Dispatch<SetStateAction<string>>
}

export const MigrationKind = {
  MOVE: 'move',
  DELETE: 'delete',
} as const
export type MigrationKindKeys = (typeof MigrationKind)[keyof typeof MigrationKind]

export default function SchemaMigrator({
  sourceSchema,
  targetSchema,
  questionMigrations,
  setQuestionMigrations,
  handleSubmitMigrationPlan,
  submitErrorText = '',
  migrationName,
  setMigrationName,
  migrationDescription,
  setMigrationDescription,
}: SchemaMigratorProps) {
  const [sourceSchemaQuestion, setSourceSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [targetSchemaQuestion, setTargetSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [questionMigrationKind, setQuestionMigrationKind] = useState<MigrationKindKeys>(MigrationKind.MOVE)
  const [actionErrorText, setActionErrorText] = useState('')
  const [draft, setDraft] = useState(false)

  const [isSourceSchemaActive, setIsSourceSchemaActive] = useState(false)
  const [isTargetSchemaActive, setIsTargetSchemaActive] = useState(false)

  const theme = useTheme()

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(menuAnchorEl)

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setMenuAnchorEl(null)
  }

  const handleRemoveActionItem = useCallback(
    (action: QuestionMigration) => {
      setQuestionMigrations(questionMigrations.filter((questionMigration) => questionMigration.id !== action.id))
    },
    [questionMigrations, setQuestionMigrations],
  )

  const actionsList = useMemo(() => {
    if (questionMigrations.length === 0) {
      return <Typography>No actions</Typography>
    }
    return questionMigrations.map((migrationAction) => {
      if (migrationAction.kind === MigrationKind.MOVE) {
        return (
          <Stack direction='row' spacing={1} alignItems='center' key={migrationAction.id}>
            <Tooltip title='Remove action'>
              <IconButton
                onClick={() => handleRemoveActionItem(migrationAction)}
                aria-label={`Remove action ${migrationAction.id}`}
              >
                <Close color='error' />
              </IconButton>
            </Tooltip>
            <Typography sx={{ overflow: 'hidden', wordBreak: 'break-word' }}>
              Source field <span style={{ fontWeight: 'bold' }}>{migrationAction.sourcePath}</span> mapped to target
              field <span style={{ fontWeight: 'bold' }}>{migrationAction.targetPath}</span>
            </Typography>
          </Stack>
        )
      }
      if (migrationAction.kind === MigrationKind.DELETE) {
        return (
          <Stack direction='row' spacing={1} alignItems='center' key={migrationAction.id}>
            <IconButton
              onClick={() => handleRemoveActionItem(migrationAction)}
              aria-label={`Remove action ${migrationAction.id}`}
            >
              <Close color='error' />
            </IconButton>
            <Typography sx={{ overflow: 'hidde', wordBreak: 'break-word' }}>
              Source field <span style={{ fontWeight: 'bold' }}>{migrationAction.sourcePath}</span> deleted
            </Typography>
          </Stack>
        )
      }
    })
  }, [questionMigrations, handleRemoveActionItem])

  const checkObjectsMatch = (...objects) => {
    if (!sourceSchemaQuestion || !targetSchemaQuestion) {
      return false
    }
    const keys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), [])
    const union = new Set(keys)
    return objects.every((object) => union.size === Object.keys(object).length)
  }

  const handleAddNewAction = () => {
    setActionErrorText('')
    if (!sourceSchemaQuestion) {
      return setActionErrorText('Please select a source question')
    }
    if (!targetSchemaQuestion && questionMigrationKind !== MigrationKind.DELETE) {
      return setActionErrorText('Please select a target question')
    }
    const formId = `${questionMigrationKind}.${sourceSchemaQuestion.path}.${targetSchemaQuestion?.path}`
    if (questionMigrations.some((questionMigration) => questionMigration.id === formId)) {
      return setActionErrorText('This action already exists')
    }
    if (
      questionMigrationKind === MigrationKind.MOVE &&
      sourceSchemaQuestion.schema.type !== targetSchemaQuestion?.schema.type
    ) {
      return setActionErrorText('You cannot map two questions with different value types')
    }
    if (
      sourceSchemaQuestion.schema.type === 'object' &&
      targetSchemaQuestion &&
      targetSchemaQuestion.schema.type == 'object' &&
      !checkObjectsMatch(sourceSchemaQuestion.schema.properties, targetSchemaQuestion.schema.properties)
    ) {
      return setActionErrorText('You cannot map two sub-sections that contain different questions')
    }
    const newQuestionMigration: QuestionMigration = {
      id: formId,
      kind: questionMigrationKind,
      sourcePath: sourceSchemaQuestion.path,
      targetPath: targetSchemaQuestion?.path,
      propertyType: sourceSchemaQuestion.schema.type as string,
    }
    setQuestionMigrations([...questionMigrations, newQuestionMigration])
    setSourceSchemaQuestion(undefined)
    setTargetSchemaQuestion(undefined)
    setIsSourceSchemaActive(false)
    setIsTargetSchemaActive(false)
  }

  const handleSelectSourceQuestion = () => {
    setIsSourceSchemaActive(true)
    setIsTargetSchemaActive(false)
  }

  const handleSelectTargetQuestion = () => {
    setIsSourceSchemaActive(false)
    setIsTargetSchemaActive(true)
  }

  const handleSourceQuestionOnClick = (selection: QuestionSelection) => {
    setActionErrorText('')
    setSourceSchemaQuestion(selection)
  }

  const handleTargetQuestionOnClick = (selection: QuestionSelection) => {
    setActionErrorText('')
    if (questionMigrationKind !== MigrationKind.DELETE) {
      setTargetSchemaQuestion(selection)
    }
  }

  const handleMigrationKindOnChange = (event: SelectChangeEvent) => {
    if (event.target.value === MigrationKind.DELETE) {
      setTargetSchemaQuestion(undefined)
      setIsTargetSchemaActive(false)
    }
    setActionErrorText('')
    setQuestionMigrationKind(event.target.value as MigrationKindKeys)
  }

  const displayButtonText = (schemaQuestion: QuestionSelection | undefined, defaultText: string) => {
    if (!schemaQuestion) {
      return defaultText
    }
    if (
      schemaQuestion?.schema.type === 'array' &&
      schemaQuestion.schema.items &&
      schemaQuestion.schema.items['title']
    ) {
      // The title can be defined either inside the items child-object, or  at the root of the property
      return truncateText(schemaQuestion.schema.items['title'], 30)
    } else {
      return truncateText(schemaQuestion?.schema.title, 30)
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid
          size={{ sm: 12, md: 3 }}
          sx={{ borderStyle: 'solid', borderWidth: '1px', borderColor: theme.palette.divider, pt: 2 }}
        >
          <Stack spacing={2}>
            <Typography sx={{ px: 2 }} variant='h6' fontWeight='bold'>
              Actions
            </Typography>
            <Divider />
            <Stack sx={{ p: 2 }} spacing={2}>
              <Stack spacing={1}>
                <Typography id='schema-action-type' fontWeight='bold'>
                  Action type
                </Typography>
                <Select
                  defaultValue={MigrationKind.MOVE}
                  size='small'
                  sx={{ width: '100%' }}
                  inputProps={{ 'aria-labelledby': 'schema-action-type' }}
                  value={questionMigrationKind}
                  onChange={handleMigrationKindOnChange}
                >
                  <MenuItem value={MigrationKind.MOVE}>Move</MenuItem>
                  <MenuItem value={MigrationKind.DELETE}>Delete</MenuItem>
                </Select>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Source question</Typography>
                <Button
                  size='small'
                  sx={{
                    width: '100%',
                  }}
                  onClick={handleSelectSourceQuestion}
                  aria-label='select source schema question'
                >
                  {displayButtonText(sourceSchemaQuestion, 'Select source question')}
                </Button>
              </Stack>
              {questionMigrationKind !== MigrationKind.DELETE && (
                <Stack spacing={1}>
                  <Typography fontWeight='bold'>Target question</Typography>
                  <Button
                    size='small'
                    sx={{ width: '100%' }}
                    onClick={handleSelectTargetQuestion}
                    aria-label='select target schema question'
                  >
                    {displayButtonText(targetSchemaQuestion, 'Select target question')}
                  </Button>
                </Stack>
              )}
              <Stack spacing={2}>
                <Button variant='outlined' onClick={handleAddNewAction} aria-label='add action'>
                  Add action
                </Button>
                <Typography color='error'>{actionErrorText}</Typography>
                <Divider />
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                    <Typography fontWeight='bold'>
                      View Actions {questionMigrations.length > 0 ? `(${questionMigrations.length})` : ''}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {actionsList}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Stack>
              <Divider />
              <Stack spacing={2}>
                <Stack spacing={1}>
                  <Typography fontWeight='bold'>Migration name</Typography>
                  <TextField
                    size='small'
                    value={migrationName}
                    onChange={(e) => setMigrationName(e.target.value)}
                    label='migration plan name input'
                  />
                </Stack>
                <Stack spacing={1}>
                  <Typography fontWeight='bold'>Migration description (optional)</Typography>
                  <TextField
                    size='small'
                    multiline
                    label='migration plan description input'
                    minRows={4}
                    maxRows={10}
                    value={migrationDescription}
                    onChange={(e) => setMigrationDescription(e.target.value)}
                  />
                </Stack>
                <ClickAwayListener onClickAway={handleClose}>
                  <ButtonGroup variant='contained' color='primary'>
                    <Button
                      onClick={() => handleSubmitMigrationPlan(draft)}
                      aria-label={`${draft ? 'draft' : 'submit'} migration plan`}
                      fullWidth
                    >
                      {draft ? 'Draft migration Plan' : 'Submit migration plan'}
                    </Button>
                    <Button size='small' onClick={handleToggle} aria-label='dropdown for save options'>
                      <ArrowDropDownIcon />
                    </Button>
                  </ButtonGroup>
                </ClickAwayListener>
                <Menu
                  anchorEl={menuAnchorEl}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  open={open}
                >
                  <MenuItem selected={!draft} onClick={() => setDraft(false)} aria-label='submit migration plan'>
                    <ListItemText>{'Submit migration plan'}</ListItemText>
                  </MenuItem>
                  <MenuItem selected={draft} onClick={() => setDraft(true)} aria-label='draft migration plan'>
                    <ListItemText>{'Draft migration plan'}</ListItemText>
                  </MenuItem>
                </Menu>
                <Typography color='error'>{submitErrorText}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Grid>
        <Grid size={{ sm: 12, md: 9 }}>
          {sourceSchema && isSourceSchemaActive && (
            <Stack
              spacing={2}
              sx={{ borderStyle: 'solid', borderWidth: '1px', borderColor: theme.palette.divider, pt: 2 }}
            >
              <Box sx={{ px: 2 }}>
                <Typography variant='h6' fontWeight='bold'>
                  Source Schema
                </Typography>
                <Typography variant='caption'>{sourceSchema.splitSchema.reference}</Typography>
              </Box>
              <Divider />
              <JsonSchemaViewer
                splitSchema={sourceSchema.splitSchema}
                setSplitSchema={() => {}}
                onQuestionClick={(selection: QuestionSelection) => handleSourceQuestionOnClick(selection)}
                activePath={sourceSchemaQuestion?.path}
              />
            </Stack>
          )}
          {targetSchema && isTargetSchemaActive && (
            <Stack
              spacing={2}
              sx={{ borderStyle: 'solid', borderWidth: '1px', borderColor: theme.palette.divider, pt: 2 }}
            >
              <Box sx={{ px: 2 }}>
                <Typography variant='h6' fontWeight='bold'>
                  Target Schema
                </Typography>
                <Typography variant='caption'>{targetSchema.splitSchema.reference}</Typography>
              </Box>
              <Divider />
              <JsonSchemaViewer
                splitSchema={targetSchema.splitSchema}
                setSplitSchema={() => {}}
                onQuestionClick={(selection: QuestionSelection) => handleTargetQuestionOnClick(selection)}
                activePath={targetSchemaQuestion?.path}
              />
            </Stack>
          )}
          {(!isTargetSchemaActive || !isSourceSchemaActive) && (
            <Stack sx={{ height: '100%' }} justifyContent='center' alignItems='center'>
              <em>Select source or target question on the actions menu to view the schema</em>
            </Stack>
          )}
        </Grid>
      </Grid>
      <Box paddingTop={2}></Box>
    </>
  )
}
