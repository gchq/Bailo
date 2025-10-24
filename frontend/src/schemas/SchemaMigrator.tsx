import { Close, ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Grid2,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { postSchemaMigration } from 'actions/schemaMigration'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import JsonSchemaViewer, { QuestionSelection } from 'src/Form/JsonSchemaViewer'
import { CombinedSchema, QuestionMigration } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { truncateText } from 'utils/stringUtils'

interface SchemaMigratorProps {
  sourceSchema: CombinedSchema
  targetSchema: CombinedSchema
}

export const MigrationKind = {
  MOVE: 'move',
  DELETE: 'delete',
} as const
export type MigrationKindKeys = (typeof MigrationKind)[keyof typeof MigrationKind]

export default function SchemaMigrator({ sourceSchema, targetSchema }: SchemaMigratorProps) {
  const [sourceSchemaQuestion, setSourceSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [targetSchemaQuestion, setTargetSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])
  const [questionMigrationKind, setQuestionMigrationKind] = useState<MigrationKindKeys>(MigrationKind.MOVE)
  const [actionErrorText, setActionErrorText] = useState('')
  const [submitErrorText, setSubmitErrorText] = useState('')
  const [isSourceSchemaActive, setIsSourceSchemaActive] = useState(false)
  const [isTargetSchemaActive, setIsTargetSchemaActive] = useState(false)
  const [migrationName, setMigrationName] = useState('')
  const [migrationDescription, setMigrationDescription] = useState('')

  const theme = useTheme()
  const router = useRouter()

  const handleRemoveActionItem = useCallback(
    (action: QuestionMigration) => {
      setQuestionMigrations(questionMigrations.filter((questionMigration) => questionMigration.id !== action.id))
    },
    [questionMigrations],
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
            <Typography sx={{ overflow: 'hidde', wordBreak: 'break-word' }}>
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

  const handleSubmitMigrationPlan = async () => {
    setSubmitErrorText('')
    if (migrationName === '') {
      return setSubmitErrorText('You must set a name for this migration plan')
    }
    if (questionMigrations.length === 0) {
      return setSubmitErrorText('You must have at least one action before submitting a migration plan.')
    }
    const res = await postSchemaMigration({
      name: migrationName,
      description: migrationDescription,
      sourceSchema: sourceSchema.schema.id,
      targetSchema: targetSchema.schema.id,
      questionMigrations: questionMigrations,
    })
    if (!res.ok) {
      setSubmitErrorText(await getErrorMessage(res))
    } else {
      router.push('/schemas/list?tab=migrations')
    }
  }

  return (
    <>
      <Grid2 container spacing={2}>
        <Grid2
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
                <Typography fontWeight='bold'>Action type</Typography>
                <Select
                  defaultValue={MigrationKind.MOVE}
                  size='small'
                  sx={{ width: '100%' }}
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
                  <TextField size='small' value={migrationName} onChange={(e) => setMigrationName(e.target.value)} />
                </Stack>
                <Stack spacing={1}>
                  <Typography fontWeight='bold'>Migration description (optional)</Typography>
                  <TextField
                    size='small'
                    multiline
                    minRows={4}
                    maxRows={10}
                    value={migrationDescription}
                    onChange={(e) => setMigrationDescription(e.target.value)}
                  />
                </Stack>
                <Button variant='contained' onClick={handleSubmitMigrationPlan} aria-label='submit migration plan'>
                  Submit migration plan
                </Button>
                <Typography color='error'>{submitErrorText}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Grid2>
        <Grid2 size={{ sm: 12, md: 9 }}>
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
        </Grid2>
      </Grid2>
      <Box paddingTop={2}></Box>
    </>
  )
}
