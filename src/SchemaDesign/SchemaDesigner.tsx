import { Schema, SchemaQuestion } from '@/types/interfaces'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import React from 'react'
import QuestionPicker from './QuestionPicker'

export default function SchemaDesigner() {
  const [questionPickerOpen, setQuestionPickerOpen] = React.useState(false)
  const [pages, setPages] = React.useState<any[]>([])
  const [pageName, setPageName] = React.useState('')
  const [pageReference, setPageReference] = React.useState('')
  const [selectedPage, setSelectedPage] = React.useState('')
  const [schema, setSchema] = React.useState<Schema>({
    name: 'test-schema',
    reference: 'test-schema',
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
        ...pages,
      },
    },
    use: 'UPLOAD',
  })

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
    const pageToAmmend = pages.find((page) => page.reference === selectedPage)
    pageToAmmend.questions.push(data)
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
        }}
      >
        <Box component='form' onSubmit={addNewPage}>
          <Stack direction='row' spacing={1}>
            <TextField
              required
              label='Page name'
              onChange={(event): void => setPageName(event.target.value)}
              value={pageName}
            />
            <TextField
              required
              label='Page reference'
              onChange={(event): void => setPageReference(event.target.value)}
              value={pageReference}
            />
            <Button type='submit'>Add new page</Button>
          </Stack>
        </Box>
      </Paper>
      <Paper
        sx={{
          p: 2,
          mt: 4,
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
                <Stack spacing={2}>
                  {page.questions.map((question) => (
                    <Typography key={question.title}>{question.title}</Typography>
                  ))}
                  <Button onClick={handleClickOpen}>Add new question</Button>
                </Stack>
              </Box>
            )}
          </Box>
        ))}
        {selectedPage === '' && <Typography>Add a new page to begin designing your schema</Typography>}
      </Paper>
      <QuestionPicker onSubmit={addQuestion} handleClose={handleClose} questionPickerOpen={questionPickerOpen} />
    </Box>
  )
}
