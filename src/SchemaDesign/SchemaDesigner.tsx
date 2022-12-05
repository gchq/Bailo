/* eslint-disable react/jsx-props-no-spreading */
import { Schema, SchemaQuestion, SplitSchema } from '@/types/interfaces'
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
import React, { useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { getStepsFromSchema } from '@/utils/formUtils'
import QuestionPicker from './QuestionPicker'
import { Theme as MaterialUITheme } from '../MuiForms'

const SchemaForm = withTheme(MaterialUITheme)

export default function SchemaDesigner() {
  const [questionPickerOpen, setQuestionPickerOpen] = React.useState(false)
  const [pages, setPages] = React.useState<any[]>([])
  const [pageName, setPageName] = React.useState('')
  const [pageReference, setPageReference] = React.useState('')
  const [selectedPage, setSelectedPage] = React.useState('')
  const [splitSchema, setSplitSchema] = React.useState<SplitSchema>({ reference: '', steps: [] })
  const [schemaName, setSchemaName] = React.useState('')
  const [showForm, setShowForm] = React.useState(true)
  const [schemaReference, setSchemaReference] = React.useState('')
  const [schemaDetails, setSchemaDetails] = React.useState({
    name: '',
    reference: '',
  })

  const pageIndex = pages.findIndex((page) => page.reference === selectedPage)

  useEffect(() => {
    if (pages) {
      const userPages = {}
      pages.forEach((page) => {
        const pageToAdd = {
          [page.reference]: {
            title: page.title,
            type: 'object',
            properties: {},
          },
        }
        if (page.questions && page.questions.length > 0) {
          page.questions.forEach((question) => {
            const questionReference = question.reference
            const questionToAdd = {
              [questionReference]: { ...question },
            }
            delete questionToAdd[questionReference].reference
            pageToAdd[page.reference].properties = { ...pageToAdd[page.reference].properties, ...questionToAdd }
          })
          Object.assign(userPages, pageToAdd)
        }
      })
      const userSchema: Schema = {
        name: schemaDetails.name,
        reference: schemaDetails.reference,
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
            ...userPages,
          },
        },
        use: 'UPLOAD',
      }
      const { reference } = userSchema
      const steps = getStepsFromSchema(userSchema, {}, [])
      setSplitSchema({ reference, steps })
      setShowForm(false)
    }
  }, [schemaDetails, pages, setSplitSchema])

  // This is the only way we can find to force the form to rerender
  useEffect(() => {
    if (!showForm) setShowForm(true)
  }, [showForm])

  const handlePageChange = (_event, newValue) => {
    setSelectedPage(newValue)
  }

  const handleClickOpen = () => {
    setQuestionPickerOpen(true)
  }

  const handleClose = () => {
    setQuestionPickerOpen(false)
  }

  const addNewPage = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (
      pages.filter((page) => page.title === pageName).length === 0 &&
      pages.filter((page) => page.reference === pageReference).length === 0
    ) {
      const newPage = {
        title: pageName,
        reference: pageReference,
        questions: [],
      }
      setPages((oldPages) => [...oldPages, newPage])
      setSelectedPage(pageReference)
      setPageName('')
      setPageReference('')
    }
  }

  const addQuestion = (data: SchemaQuestion) => {
    const updatedPages = pages
    const pageToAmmend = updatedPages.find((page) => page.reference === selectedPage)
    pageToAmmend.questions.push(data)
    setPages(updatedPages)
  }

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = (result) => {
    if (!result.destination) {
      return
    }
    if (result.destination.index === result.source.index) {
      return
    }
    const pageToAmmend = pages.find((page) => page.reference === selectedPage)
    const updatedQuestions = reorder(pageToAmmend.questions, result.source.index, result.destination.index)

    setPages(pages.map((page) => (page.reference === selectedPage ? { ...page, questions: updatedQuestions } : page)))
  }

  const updateSchemaName = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    setSchemaDetails({
      name: schemaName,
      reference: schemaReference,
    })
  }

  return (
    <Box>
      <Stack direction='row' spacing={4}>
        <Box>
          <Stack spacing={4}>
            <Paper
              sx={{
                p: 2,
              }}
            >
              <Box component='form' onSubmit={updateSchemaName}>
                <Stack direction='row' spacing={1}>
                  <TextField
                    required
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
                  <Button type='submit'>Update schema details</Button>
                </Stack>
              </Box>
            </Paper>
            <Divider flexItem />
            <Paper
              sx={{
                p: 2,
              }}
            >
              <Box component='form' onSubmit={addNewPage}>
                <Stack direction='row' spacing={1}>
                  <TextField
                    required
                    label='Page reference'
                    onChange={(event): void => setPageReference(event.target.value)}
                    value={pageReference}
                  />
                  <TextField
                    required
                    label='Page name'
                    onChange={(event): void => setPageName(event.target.value)}
                    value={pageName}
                  />
                  <Button type='submit'>Add new page</Button>
                </Stack>
              </Box>
            </Paper>
            <Paper
              sx={{
                p: 2,
              }}
            >
              <Tabs value={selectedPage} onChange={handlePageChange}>
                {pages.map((page) => (
                  <Tab key={page.reference} value={page.reference} label={page.title} />
                ))}
              </Tabs>

              {pages.map((page) => (
                <Box key={page.reference}>
                  {page.reference === selectedPage && (
                    <Box sx={{ pt: 2 }}>
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId='list'>
                          {(droppableProvided) => (
                            <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
                              {page.questions.map((question, index) => (
                                <Draggable key={question.title} draggableId={question.title} index={index}>
                                  {(draggableProvided) => (
                                    <div
                                      ref={draggableProvided.innerRef}
                                      {...draggableProvided.draggableProps}
                                      {...draggableProvided.dragHandleProps}
                                    >
                                      <Typography key={question.title}>{question.title}</Typography>
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
                </Box>
              ))}
              {selectedPage === '' && <Typography>Add a new page to begin designing your schema</Typography>}
            </Paper>
          </Stack>
        </Box>
        <Paper
          sx={{
            p: 2,
            width: '100%',
          }}
        >
          {showForm && splitSchema?.steps[pageIndex]?.schema !== undefined && (
            <SchemaForm
              schema={splitSchema.steps[pageIndex].schema}
              formData={splitSchema.steps[pageIndex].state}
              uiSchema={splitSchema.steps[pageIndex].uiSchema}
            >
              {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
              <></>
            </SchemaForm>
          )}
        </Paper>
      </Stack>
      <QuestionPicker onSubmit={addQuestion} handleClose={handleClose} questionPickerOpen={questionPickerOpen} />
    </Box>
  )
}
