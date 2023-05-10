import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Icon from '@mui/material/Icon'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React, { useState } from 'react'

import { SchemaQuestion } from '../../types/types'
import SchemaDesignerQuestion, { DesignerQuestion } from './SchemaDesignerQuestion'

const questionList: DesignerQuestion[] = [
  {
    title: 'Text',
    type: 'string',
    icon: <TextFieldsIcon />,
    additionalQuestions: ['minLength', 'maxLength'],
  },
  {
    title: 'Check Box',
    type: 'boolean',
    icon: <CheckBoxIcon />,
    additionalQuestions: [],
  },
  {
    title: 'Date',
    type: 'string',
    format: 'date',
    icon: <CalendarMonthIcon />,
    additionalQuestions: [],
  },
]

export default function QuestionPicker({
  onSubmit,
  handleClose,
  questionPickerOpen,
}: {
  onSubmit: (data: SchemaQuestion) => void
  handleClose: () => void
  questionPickerOpen: boolean
}) {
  const [expanded, setExpanded] = useState('')

  const handleAccordionChange = (panel: string) => {
    setExpanded(panel)
  }

  return (
    <Dialog onClose={handleClose} open={questionPickerOpen} sx={{ p: 2 }}>
      <DialogTitle>Choose a question type</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          The question reference must be unique, if it is left blank it will be generated automatically using the
          question title. The question title is what is displayed on the form itself.
        </DialogContentText>
        {questionList.map((question) => (
          <Accordion
            key={question.title}
            expanded={expanded === question.title}
            onChange={() => handleAccordionChange(question.title)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction='row' spacing={1}>
                <Icon color='primary'>{question.icon}</Icon>
                <Typography>{question.title}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <SchemaDesignerQuestion question={question} onSubmit={onSubmit} closeQuestionPicker={handleClose} />
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  )
}
