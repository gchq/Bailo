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

type MigrationKind = 'mapping' | 'delete'

export default function SchemaMigrator({ sourceSchema, targetSchema }: SchemaMigratorProps) {
  const [splitSourceSchema, setSplitSourceSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [splitTargetSchema, setSplitTargetSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [sourceSchemaQuestion, setSourceSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [targetSchemaQuestion, setTargetSchemaQuestion] = useState<QuestionSelection | undefined>(undefined)
  const [questionMigrations, setQuestionMigrations] = useState<QuestionMigration[]>([])
  const [questionMigrationKind, setQuestionMigrationKind] = useState<MigrationKind>('mapping')
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
    return questionMigrations.map((migrationAction) => {
      if (migrationAction.kind === 'mapping') {
        return (
          <Stack direction='row' spacing={1} alignItems='center' key={migrationAction.id}>
            <IconButton onClick={() => handleRemoveActionItem(migrationAction)}>
              <Close color='error' />
            </IconButton>
            <Typography>
              Source field <span style={{ fontWeight: 'bold' }}>{migrationAction.sourcePath}</span> mapped to target
              field <span style={{ fontWeight: 'bold' }}>{migrationAction.targetPath}</span>
            </Typography>
          </Stack>
        )
      }
      if (migrationAction.kind === 'delete') {
        return (
          <Stack direction='row' spacing={1} alignItems='center' key={migrationAction.id}>
            <IconButton onClick={() => handleRemoveActionItem(migrationAction)}>
              <Close color='error' />
            </IconButton>
            <Typography>
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
    if (!targetSchemaQuestion && questionMigrationKind !== 'delete') {
      return setErrorText('Please select a target question')
    }
    const formId = `${questionMigrationKind}.${sourceSchemaQuestion.path}.${targetSchemaQuestion?.path}`
    if (questionMigrations.some((questionMigration) => questionMigration.id === formId)) {
      return setErrorText('This action already exists')
    }
    const newQuestionMigration: QuestionMigration = {
      id: formId,
      kind: questionMigrationKind,
      sourcePath: sourceSchemaQuestion.path,
      targetPath: targetSchemaQuestion?.path,
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
    setSourceSchemaQuestion(selection)
  }

  const handleTargetQuestionOnClick = (selection: QuestionSelection) => {
    if (questionMigrationKind !== 'delete') {
      setTargetSchemaQuestion(selection)
    }
  }

  const handleMigrationKindOnChange = (event: SelectChangeEvent) => {
    if (event.target.value === 'delete') {
      setTargetSchemaQuestion(undefined)
      setIsTargetSchemaActive(false)
    }
    setQuestionMigrationKind(event.target.value as MigrationKind)
  }

  const handleSubmitMigrationPlan = () => {}

  return (
    <>
      <Grid2 container spacing={2}>
        <Grid2
          size={{ sm: 12, md: 4 }}
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
                  defaultValue='mapping'
                  size='small'
                  sx={{ width: '100%' }}
                  value={questionMigrationKind}
                  onChange={handleMigrationKindOnChange}
                >
                  <MenuItem value={'mapping'}>Mapping</MenuItem>
                  <MenuItem value={'delete'}>Delete</MenuItem>
                </Select>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Source question path</Typography>
                <Button size='small' variant='outlined' sx={{ width: '100%' }} onClick={handleSelectSourceQuestion}>
                  {sourceSchemaQuestion?.path || 'Select source question'}
                </Button>
              </Stack>
              {questionMigrationKind !== 'delete' && (
                <Stack spacing={1}>
                  <Typography fontWeight='bold'>Target question path</Typography>
                  <Button size='small' variant='outlined' sx={{ width: '100%' }} onClick={handleSelectTargetQuestion}>
                    {targetSchemaQuestion?.path || 'Select target question'}
                  </Button>
                </Stack>
              )}
              <Stack spacing={2}>
                <Button onClick={handleAddNewAction}>Add action</Button>
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
              <Button variant='contained' onClick={handleSubmitMigrationPlan}>
                Submit migration plan
              </Button>
            </Stack>
          </Stack>
        </Grid2>
        <Grid2 size={{ sm: 12, md: 8 }}>
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
