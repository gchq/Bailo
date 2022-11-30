import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import React from 'react'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import Typography from '@mui/material/Typography'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DialogContent from '@mui/material/DialogContent'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import Stack from '@mui/material/Stack'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import Icon from '@mui/material/Icon'
import { SchemaQuestion } from '@/types/interfaces'
import SchemaDesignerQuestion from './SchemaDesignerQuestion'

export default function QuestionPicker({
  onSubmit,
  handleClose,
  questionPickerOpen,
}: {
  onSubmit: (data: SchemaQuestion) => void
  handleClose: () => void
  questionPickerOpen: boolean
}) {
  const [expanded, setExpanded] = React.useState<string>('')

  const handleAccordianChange = (panel: string) => {
    setExpanded(panel)
  }

  const questionList = [
    {
      title: 'Text',
      type: 'string',
      icon: <TextFieldsIcon />,
      additionalQuestions: ['minLength', 'maxLength'],
    },
    {
      title: 'Boolean',
      type: 'boolean',
      icon: <CheckBoxIcon />,
      additionalQuestions: [],
    },
  ]

  return (
    <Dialog onClose={handleClose} open={questionPickerOpen} sx={{ p: 2 }}>
      <DialogTitle>Choose a question type</DialogTitle>
      <DialogContent>
        {questionList.map((question) => (
          <Accordion
            key={question.title}
            expanded={expanded === question.title}
            onChange={() => handleAccordianChange(question.title)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
              <Stack direction='row' spacing={1}>
                <Icon color='primary'>{question.icon}</Icon>
                <Typography>{question.title}</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <SchemaDesignerQuestion
                questionType={question.type}
                onSubmit={onSubmit}
                closeQuestionPicker={handleClose}
                additionalQuestions={question.additionalQuestions}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  )
}
