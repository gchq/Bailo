/* eslint-disable dot-notation */
import { SchemaQuestion } from '@/types/interfaces'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import React from 'react'

export default function SchemaDesignerQuestion({
  onSubmit,
  question,
  closeQuestionPicker,
}: {
  onSubmit: (data: SchemaQuestion) => void
  question: any // type this
  closeQuestionPicker: () => void
}) {
  const [formInput, setFormInput] = React.useState<SchemaQuestion>({
    title: '',
    description: '',
    type: question.type,
    reference: '',
    format: question.format || '',
  })

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { value, name }: { value: string | number; name: string } = event.target
    if (value || (!value && event.target.attributes['required'])) {
      setFormInput({
        ...formInput,
        [event.target.name]: value,
      })
    } else {
      setFormInput((prevData) => {
        const newData = { ...prevData }
        delete newData[name]
        return newData
      })
    }
  }

  const addQuestion = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    onSubmit(formInput)
    closeQuestionPicker()
  }

  return (
    <Box component='form' onSubmit={addQuestion}>
      <Stack spacing={2}>
        <TextField
          required
          label='Question reference'
          name='reference'
          value={formInput.reference}
          onChange={handleChange}
        />
        <TextField required label='Question text' name='title' value={formInput.title} onChange={handleChange} />
        <TextField
          label='Question description'
          name='description'
          value={formInput.description}
          onChange={handleChange}
        />
        {question.additionalQuestions.includes('minLength') && (
          <TextField
            label='Minimum length'
            type='number'
            name='minLength'
            value={formInput.minLength || undefined}
            onChange={handleChange}
          />
        )}
        {question.additionalQuestions.includes('maxLength') && (
          <TextField
            label='Maximum length'
            type='number'
            name='maxLength'
            value={formInput.maxLength || undefined}
            onChange={handleChange}
          />
        )}
        <Button type='submit'>Add question</Button>
      </Stack>
    </Box>
  )
}
