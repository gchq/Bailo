import { SchemaQuestion } from '@/types/interfaces'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import React, { BaseSyntheticEvent, ReactElement, useState } from 'react'

export type DesignerQuestion = {
  title: string
  type: string
  format?: string
  icon: ReactElement<any, any>
  additionalQuestions: string[]
}

export default function SchemaDesignerQuestion({
  onSubmit,
  question,
  closeQuestionPicker,
}: {
  onSubmit: (data: SchemaQuestion) => void
  question: DesignerQuestion
  closeQuestionPicker: () => void
}) {
  const [formInput, setFormInput] = useState<SchemaQuestion>({
    title: '',
    description: '',
    type: question.type,
    reference: '',
    format: question.format || '',
  })

  const handleChange = (event: BaseSyntheticEvent) => {
    if (event.target.value || (!event.target.value && event.target.attributes.required)) {
      setFormInput({
        ...formInput,
        [event.target.name]: event.target.value,
      })
    } else {
      setFormInput((prevData) => {
        const newData = { ...prevData }
        delete newData[event.target.name]
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
        <TextField label='Question reference' name='reference' value={formInput.reference} onChange={handleChange} />
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
            disabled
            name='minLength'
            value={formInput.minLength || ''}
            onChange={handleChange}
          />
        )}
        {question.additionalQuestions.includes('maxLength') && (
          <TextField
            label='Maximum length'
            type='number'
            disabled
            name='maxLength'
            value={formInput.maxLength || ''}
            onChange={handleChange}
          />
        )}
        <Button type='submit'>Add question</Button>
      </Stack>
    </Box>
  )
}
