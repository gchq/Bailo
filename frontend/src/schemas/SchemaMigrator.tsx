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
  Typography,
} from '@mui/material'
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
    }
    setQuestionMigrationKind(event.target.value as MigrationKind)
  }

  const handleSubmitMigrationPlan = () => {}

  return (
    <>
      <Grid2 container spacing={2}>
        {sourceSchema ? (
          <Grid2 size={{ sm: 12, md: 4 }}>
            <JsonSchemaViewer
              splitSchema={splitSourceSchema}
              setSplitSchema={setSplitSourceSchema}
              onQuestionClick={(selection: QuestionSelection) => handleSourceQuestionOnClick(selection)}
              activePath={sourceSchemaQuestion?.path}
            />
          </Grid2>
        ) : (
          <Typography>No valid source schema</Typography>
        )}
        {targetSchema ? (
          <Grid2 size={{ sm: 12, md: 4 }}>
            <JsonSchemaViewer
              splitSchema={splitTargetSchema}
              setSplitSchema={setSplitTargetSchema}
              onQuestionClick={(selection: QuestionSelection) => handleTargetQuestionOnClick(selection)}
              activePath={targetSchemaQuestion?.path}
            />
          </Grid2>
        ) : (
          <Typography>No valid target schema</Typography>
        )}
        <Grid2 size={{ sm: 12, md: 4 }}>
          <Stack spacing={2}>
            <Typography sx={{ px: 2 }} variant='h6' fontWeight='bold'>
              Actions
            </Typography>
            <Stack sx={{ px: 2 }} spacing={2}>
              <Box>
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
              </Box>
              <Box>
                <Typography fontWeight='bold'>Source question path</Typography>
                <TextField
                  sx={{ width: '100%' }}
                  size='small'
                  placeholder='Source question'
                  value={sourceSchemaQuestion?.path || ''}
                />
              </Box>
              <Box>
                <Typography fontWeight='bold'>Target question path</Typography>
                <TextField
                  sx={{ width: '100%' }}
                  size='small'
                  placeholder='Target question'
                  value={targetSchemaQuestion?.path || ''}
                  disabled={questionMigrationKind === 'delete'}
                />
              </Box>
              <Stack spacing={2}>
                <Button sx={{ width: 'max-content' }} variant='contained' onClick={handleAddNewAction}>
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
            </Stack>
          </Stack>
        </Grid2>
      </Grid2>
      <Box>
        <Button variant='contained' sx={{ width: 'max-content', float: 'right' }} onClick={handleSubmitMigrationPlan}>
          Submit migration plan
        </Button>
      </Box>
    </>
  )
}
