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
import schema from 'pages/data-card/[dataCardId]/schema'
import { useEffect, useMemo, useState } from 'react'
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
  }, [schema, sourceSchema, targetSchema])

  const actionsList = useMemo(() => {
    return questionMigrations.map((migrationAction) => {
      if (migrationAction.kind === 'mapping') {
        return (
          <Stack direction='row' spacing={1} alignItems='center'>
            <IconButton>
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
          <Stack direction='row' spacing={1} alignItems='center'>
            <IconButton>
              <Close color='error' />
            </IconButton>
            <Typography>
              Source field <span style={{ fontWeight: 'bold' }}>{migrationAction.sourcePath}</span> deleted
            </Typography>
          </Stack>
        )
      }
    })
  }, [questionMigrations])

  const handleAddNewAction = () => {
    setErrorText('')
    if (!sourceSchemaQuestion) {
      return setErrorText('Please select a source question')
    }
    if (!targetSchemaQuestion && questionMigrationKind !== 'delete') {
      return setErrorText('Please select a target question')
    }
    const newQuestionMigration: QuestionMigration = {
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
    setTargetSchemaQuestion(selection)
  }

  const handleMigrationKindOnChange = (event: SelectChangeEvent) => {
    if (event.target.value === 'delete') {
      setTargetSchemaQuestion(undefined)
    }
    setQuestionMigrationKind(event.target.value as MigrationKind)
  }

  return (
    <Grid2 container spacing={2}>
      {sourceSchema ? (
        <Grid2 size={{ sm: 12, md: 4 }}>
          <JsonSchemaViewer
            splitSchema={splitSourceSchema}
            setSplitSchema={setSplitSourceSchema}
            hideInputs
            onQuestionClick={(selection: QuestionSelection) => handleSourceQuestionOnClick(selection)}
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
            hideInputs
            onQuestionClick={(selection: QuestionSelection) => handleTargetQuestionOnClick(selection)}
          />
        </Grid2>
      ) : (
        <Typography>No valid target schema</Typography>
      )}
      <Grid2 size={{ sm: 12, md: 4 }}>
        <Stack spacing={2}>
          <Typography sx={{ textAlign: 'center' }} fontWeight='bold'>
            Actions
          </Typography>
          <Stack sx={{ p: 2 }} spacing={2}>
            <Select
              defaultValue='mapping'
              size='small'
              value={questionMigrationKind}
              onChange={handleMigrationKindOnChange}
            >
              <MenuItem value={'mapping'}>Mapping</MenuItem>
              <MenuItem value={'delete'}>Delete</MenuItem>
            </Select>
            <TextField size='small' placeholder='Source question' value={sourceSchemaQuestion?.path || ''} />
            <TextField
              size='small'
              placeholder='Target question'
              value={targetSchemaQuestion?.path || ''}
              disabled={questionMigrationKind === 'delete'}
            />
            <Stack spacing={2}>
              <Button sx={{ width: 'max-content' }} variant='contained' onClick={handleAddNewAction}>
                Add action
              </Button>
              <Typography color='error'>{errorText}</Typography>
              <Divider />
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                  <Typography fontWeight='bold'>View Actions</Typography>
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
  )
}
