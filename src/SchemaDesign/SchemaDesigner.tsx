import { Schema, SchemaQuestion, SplitSchema, SchemaType, SchemaTypes, Step } from '@/types/interfaces'
import { withTheme } from '@rjsf/core'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import React, { Fragment, useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DraggableProvided, DroppableProvided } from 'react-beautiful-dnd'
import { getStepsFromSchema } from '@/utils/formUtils'
import MenuItem from '@mui/material/MenuItem'
import Icon from '@mui/material/Icon'
import AddIcon from '@mui/icons-material/Add'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContentText from '@mui/material/DialogContentText'
import _ from 'lodash'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Clear'
import { useTheme } from '@mui/material/styles'
import { Theme as MaterialUITheme } from '../MuiForms'
import QuestionPicker from './QuestionPicker'

const SchemaForm = withTheme(MaterialUITheme)

export default function SchemaDesigner() {
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false)
  const [steps, setSteps] = useState<any[]>([])
  const [stepName, setStepName] = useState('')
  const [stepReference, setStepReference] = useState('')
  const [selectedStep, setSelectedStep] = useState('')
  const [splitSchema, setSplitSchema] = useState<SplitSchema>({ reference: '', steps: [] })
  const [schemaName, setSchemaName] = useState('')
  const [showForm, setShowForm] = useState(true)
  const [schemaReference, setSchemaReference] = useState('')
  const [schemaUse, setSchemaUse] = useState<SchemaType>(SchemaTypes.UPLOAD)
  const [newStepDialogOpen, setNewStepDialogOpen] = useState(false)
  const [submitSchemaDialogOpen, setSubmitSchemaDialogOpen] = useState(false)
  const [schema, setSchema] = useState<Schema | undefined>(undefined)
  const [stepErrorText, setStepErrorText] = useState('')

  const stepIndex = steps.findIndex((step) => step.reference === selectedStep)
  const theme = useTheme()

  useEffect(() => {
    if (steps.length > 0) {
      const userSteps = {}
      steps.forEach((step) => {
        const stepToAdd = {
          [step.reference]: {
            title: step.title,
            type: 'object',
            properties: {},
          },
        }
        if (step.questions && step.questions.length > 0) {
          step.questions.forEach((question) => {
            const questionReference = question.reference
            const questionToAdd = {
              [questionReference]: { ...question },
            }
            delete questionToAdd[questionReference].reference
            stepToAdd[step.reference].properties = { ...stepToAdd[step.reference].properties, ...questionToAdd }
          })
          Object.assign(userSteps, stepToAdd)
        }
      })
      const userSchema: Schema = {
        name: '',
        reference: '',
        schema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            timeStamp: {
              type: 'string',
              format: 'date-time',
            },
            schemaRef: {
              title: 'Schema reference',
              type: 'string',
            },
            ...userSteps,
          },
        },
        use: SchemaTypes.UPLOAD,
      }
      const { reference } = userSchema
      const schemaSteps: Step[] = getStepsFromSchema(userSchema, {}, [])
      setSchema(userSchema)
      setSplitSchema({ reference, steps: schemaSteps })
      setShowForm(false)
    }
  }, [steps, setSplitSchema])

  // This is the only way we can find to force the form to rerender
  useEffect(() => {
    if (!showForm) setShowForm(true)
  }, [showForm])

  const handleStepChange = (_event, newValue) => {
    setSelectedStep(newValue)
  }

  const handleClickOpen = () => {
    setQuestionPickerOpen(true)
  }

  const handleQuestionPickerClose = () => {
    setQuestionPickerOpen(false)
  }

  const addNewStep = (event) => {
    event.preventDefault()
    setStepErrorText('')
    if (steps.filter((step) => step.title === stepName).length === 0) {
      const newStep = {
        title: stepName,
        reference: stepReference,
        questions: [],
      }
      newStep.reference = stepReference === '' ? _.camelCase(stepName) : _.camelCase(stepReference)
      setSteps((oldSteps) => [...oldSteps, newStep])
      setSelectedStep(stepReference === '' ? _.camelCase(stepName) : _.camelCase(stepReference))
      setStepName('')
      setStepReference('')
      setNewStepDialogOpen(false)
    } else {
      setStepErrorText(`Value ${stepName} already exists`)
    }
  }

  const addQuestion = (data: SchemaQuestion) => {
    const question = data
    question.reference = data.reference === '' ? _.camelCase(data.title) : _.camelCase(data.reference)
    const updatedSteps = steps
    const stepToAmend = updatedSteps.find((step) => step.reference === selectedStep)
    const updatedQuestions = stepToAmend.questions
    updatedQuestions.push(data)
    setSteps(steps.map((step) => (step.reference === selectedStep ? { ...step, questions: updatedQuestions } : step)))
  }

  const deleteQuestion = (questionReference: string) => {
    const updatedSteps = steps
    const stepToAmend = updatedSteps.find((step) => step.reference === selectedStep)
    const updatedQuestions = stepToAmend.questions.filter((question) => question.reference !== questionReference)
    setSteps(steps.map((step) => (step.reference === selectedStep ? { ...step, questions: updatedQuestions } : step)))
  }

  const submitSchema = () => {
    const reference = schemaReference === '' ? _.camelCase(schemaName) : _.camelCase(schemaReference)
    if (schema) {
      // todo - implemented schema submission
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const userSchema = { ...schema, name: schemaName, reference, use: schemaUse }
    }
  }

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onQuestionDragEnd = (result) => {
    if (!result.destination) {
      return
    }
    if (result.destination.index === result.source.index) {
      return
    }
    const stepToAmend = steps.find((step) => step.reference === selectedStep)
    const updatedQuestions = reorder(stepToAmend.questions, result.source.index, result.destination.index)

    setSteps(steps.map((step) => (step.reference === selectedStep ? { ...step, questions: updatedQuestions } : step)))
  }

  const deleteStep = (step: string) => {
    const updatedSteps = steps.filter((stepToRemove) => stepToRemove.reference !== step)
    setSteps(updatedSteps)
    setSelectedStep('')
  }

  const getQuestionIcon = (type: string) => {
    if (type === 'date') {
      return <CalendarMonthIcon />
    }
    if (type === 'boolean') {
      return <CheckBoxIcon />
    }
    return <TextFieldsIcon />
  }

  return (
    <>
      <Alert sx={{ my: 2 }} severity='info'>
        This page is currently not fully implemented. More advanced schema options will be added in the future.
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <>
            <Typography sx={{ mb: 2 }} variant='h4'>
              Configure Schema
            </Typography>
            <Paper
              sx={{
                p: 2,
              }}
            >
              <Stack direction='row' spacing={2}>
                <Tabs value={selectedStep} onChange={handleStepChange} variant='scrollable' scrollButtons='auto'>
                  {steps.map((step) => (
                    <Tab
                      key={step.reference}
                      value={step.reference}
                      label={
                        <span>
                          {step.title}
                          <IconButton
                            size='small'
                            component='span'
                            sx={{ ml: 1 }}
                            onClick={() => {
                              deleteStep(step.reference)
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      }
                      onClick={() => setSelectedStep(step.reference)}
                    />
                  ))}
                </Tabs>

                <Button
                  color='primary'
                  variant='text'
                  startIcon={<AddIcon />}
                  onClick={() => setNewStepDialogOpen(true)}
                >
                  Add step
                </Button>
              </Stack>

              {steps.map((step) => (
                <Fragment key={step.reference}>
                  {step.reference === selectedStep && (
                    <Box sx={{ pt: 2 }}>
                      <Typography variant='caption'>Questions can be reordered by drag and drop</Typography>
                      <DragDropContext onDragEnd={onQuestionDragEnd}>
                        <Droppable droppableId='questionList'>
                          {(droppableProvided: DroppableProvided) => (
                            <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
                              {step.questions.map((question, index) => (
                                <Draggable key={question.title} draggableId={question.title} index={index}>
                                  {(draggableProvided: DraggableProvided) => (
                                    <div
                                      ref={draggableProvided.innerRef}
                                      {...draggableProvided.draggableProps}
                                      {...draggableProvided.dragHandleProps}
                                    >
                                      <Box sx={{ m: 2 }}>
                                        <Stack direction='row' alignItems='center' spacing={2}>
                                          <Icon color='primary'>{getQuestionIcon(question.type)}</Icon>
                                          <Typography key={question.title}>{question.title}</Typography>
                                          <IconButton
                                            onClick={() => deleteQuestion(question.reference)}
                                            aria-label='delete'
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Stack>
                                      </Box>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {droppableProvided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                      <Button onClick={handleClickOpen}>Add new question</Button>
                    </Box>
                  )}
                </Fragment>
              ))}
              {selectedStep === '' && <Typography>Add a new step to begin designing your schema</Typography>}
            </Paper>
          </>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography sx={{ mb: 2 }} variant='h4'>
            Preview
          </Typography>
          <Paper
            sx={{
              p: 2,
              width: '100%',
            }}
          >
            {showForm && splitSchema?.steps[stepIndex]?.schema === undefined && (
              <Typography>Nothing to preview!</Typography>
            )}
            {showForm && splitSchema?.steps[stepIndex]?.schema !== undefined && (
              <SchemaForm
                schema={splitSchema.steps[stepIndex].schema}
                formData={splitSchema.steps[stepIndex].state}
                uiSchema={splitSchema.steps[stepIndex].uiSchema}
              />
            )}
          </Paper>
        </Grid>
      </Grid>
      <Divider orientation='horizontal' flexItem sx={{ my: 4 }} />
      <Box sx={{ textAlign: 'right' }}>
        <Button variant='contained' onClick={() => setSubmitSchemaDialogOpen(true)} disabled={steps.length === 0}>
          Submit schema
        </Button>
      </Box>
      <QuestionPicker
        onSubmit={addQuestion}
        handleClose={handleQuestionPickerClose}
        questionPickerOpen={questionPickerOpen}
      />
      <Dialog open={newStepDialogOpen} onClose={() => setNewStepDialogOpen(false)}>
        <DialogTitle>Add new Step</DialogTitle>
        <Box component='form' onSubmit={addNewStep}>
          <DialogContent>
            <DialogContentText>
              The step name and reference must be unique, if it is left blank it will be generated automatically using
              the step name. The step name is the title displayed on the form itself.
            </DialogContentText>
            <Stack direction='row' spacing={2} sx={{ pt: 2 }}>
              <TextField
                label='Step reference'
                onChange={(event): void => setStepReference(event.target.value)}
                value={stepReference}
              />
              <Stack>
                <TextField
                  required
                  label='Step name'
                  onChange={(event): void => setStepName(event.target.value)}
                  value={stepName}
                />
                <Typography variant='caption' sx={{ color: theme.palette.error.main }}>
                  {stepErrorText}
                </Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewStepDialogOpen(false)}>Cancel</Button>
            <Button type='submit'>Add Step</Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Dialog open={submitSchemaDialogOpen} onClose={() => setSubmitSchemaDialogOpen(false)}>
        <DialogTitle>Submit schema</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The schema name and reference must be unique, if the reference is left blank it will be generated
            automatically using the schema name.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              label='Schema reference'
              onChange={(event): void => setSchemaReference(event.target.value)}
              value={schemaReference}
            />
            <TextField
              required
              label='Schema name'
              onChange={(event): void => setSchemaName(event.target.value)}
              value={schemaName}
            />
            <TextField
              select
              label='Schema Type'
              value={schemaUse}
              onChange={(event): void => setSchemaUse(event.target.value as SchemaType)}
            >
              <MenuItem value='UPLOAD'>Upload</MenuItem>
              <MenuItem value='DEPLOYMENT'>Deployment</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitSchemaDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitSchema}>Submit</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
