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
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useState } from 'react'
import JsonSchemaViewer, { QuestionSelection } from 'src/Form/JsonSchemaViewer'
import { QuestionMigration, SchemaInterface, SplitSchemaNoRender } from 'types/types'
import { getStepsFromSchema } from 'utils/formUtils'

interface SchemaMigratorProps {
  sourceSchema: SchemaInterface | undefined
  targetSchema: SchemaInterface | undefined
}

export const MigrationKind = {
  MOVE: 'move',
  DELETE: 'delete',
} as const
export type MigrationKindKeys = (typeof MigrationKind)[keyof typeof MigrationKind]

export default function SchemaMigrator({ sourceSchema, targetSchema }: SchemaMigratorProps) {
  const [splitSourceSchema, setSplitSourceSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [splitTargetSchema, setSplitTargetSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [sourceSchemaQuestion, setSourceSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [targetSchemaQuestion, setTargetSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])
  const [questionMigrationKind, setQuestionMigrationKind] = useState<MigrationKindKeys>(MigrationKind.MOVE)
  const [errorText, setErrorText] = useState('')
  const [isSourceSchemaActive, setIsSourceSchemaActive] = useState(false)
  const [isTargetSchemaActive, setIsTargetSchemaActive] = useState(false)

  const theme = useTheme()

  useEffect(() => {
    if (!sourceSchema || !targetSchema) return
    const sourceSteps = getStepsFromSchema(sourceSchema, {}, [])
    const targetSteps = getStepsFromSchema(targetSchema, {}, [])

    for (const step of sourceSteps) {
      step.steps = sourceSteps
    }
    setSplitSourceSchema({ reference: sourceSchema.id, steps: sourceSteps })

    for (const step of targetSteps) {
      step.steps = targetSteps
    }
    setSplitTargetSchema({ reference: targetSchema.id, steps: targetSteps })
  }, [sourceSchema, targetSchema])

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
    setErrorText('')
    if (!sourceSchemaQuestion) {
      return setErrorText('Please select a source question')
    }
    if (!targetSchemaQuestion && questionMigrationKind !== MigrationKind.DELETE) {
      return setErrorText('Please select a target question')
    }
    const formId = `${questionMigrationKind}.${sourceSchemaQuestion.path}.${targetSchemaQuestion?.path}`
    if (questionMigrations.some((questionMigration) => questionMigration.id === formId)) {
      return setErrorText('This action already exists')
    }
    if (
      questionMigrationKind === MigrationKind.MOVE &&
      sourceSchemaQuestion.schema.type !== targetSchemaQuestion?.schema.type
    ) {
      return setErrorText('You cannot map two questions with different value types')
    }
    const newQuestionMigration: QuestionMigration = {
      id: formId,
      kind: questionMigrationKind,
      sourcePath: sourceSchemaQuestion.path,
      targetPath: targetSchemaQuestion?.path,
      propertyType: sourceSchemaQuestion.schema.type,
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
    setErrorText('')
    setSourceSchemaQuestion(selection)
  }

  const handleTargetQuestionOnClick = (selection: QuestionSelection) => {
    setErrorText('')
    if (questionMigrationKind !== MigrationKind.DELETE) {
      setTargetSchemaQuestion(selection)
    }
  }

  const handleMigrationKindOnChange = (event: SelectChangeEvent) => {
    if (event.target.value === MigrationKind.DELETE) {
      setTargetSchemaQuestion(undefined)
      setIsTargetSchemaActive(false)
    }
    setErrorText('')
    setQuestionMigrationKind(event.target.value as MigrationKindKeys)
  }

  const displayButtonText = (schemaQuestion: QuestionSelection | undefined, defaultText: string) => {
    if (!schemaQuestion) {
      return defaultText
    }
    if (schemaQuestion?.schema.type === 'array') {
      // The title can be defined either inside the items child-object, or  at the root of the property
      return schemaQuestion.schema.title || schemaQuestion.schema.items.title
    } else {
      return schemaQuestion?.schema.title
    }
  }

  // TODO After the API is implemented we should POST the migration plan to the backend
  const handleSubmitMigrationPlan = () => {}

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
                  <MenuItem value={MigrationKind.MOVE}>Mapping</MenuItem>
                  <MenuItem value={MigrationKind.DELETE}>Delete</MenuItem>
                </Select>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Source question</Typography>
                <Button
                  size='small'
                  variant='outlined'
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
                    variant='outlined'
                    sx={{ width: '100%' }}
                    onClick={handleSelectTargetQuestion}
                    aria-label='select target schema question'
                  >
                    {displayButtonText(targetSchemaQuestion, 'Select target question')}
                  </Button>
                </Stack>
              )}
              <Stack spacing={2}>
                <Button onClick={handleAddNewAction} aria-label='add action'>
                  Add action
                </Button>
                <Typography color='error'>{errorText}</Typography>
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
              <Button variant='contained' onClick={handleSubmitMigrationPlan} aria-label='submit migration plan'>
                Submit migration plan
              </Button>
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
                <Typography variant='caption'>{sourceSchema.name}</Typography>
              </Box>
              <Divider />
              <JsonSchemaViewer
                splitSchema={splitSourceSchema}
                setSplitSchema={setSplitSourceSchema}
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
                <Typography variant='caption'>{targetSchema.name}</Typography>
              </Box>
              <Divider />
              <JsonSchemaViewer
                splitSchema={splitTargetSchema}
                setSplitSchema={setSplitTargetSchema}
                onQuestionClick={(selection: QuestionSelection) => handleTargetQuestionOnClick(selection)}
                activePath={targetSchemaQuestion?.path}
              />
            </Stack>
          )}
        </Grid2>
      </Grid2>
      <Box paddingTop={2}></Box>
    </>
  )
}
