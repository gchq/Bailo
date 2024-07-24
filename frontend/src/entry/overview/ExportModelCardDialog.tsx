import { Button, DialogActions, DialogContent, Divider, Stack, Typography } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import { Form } from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import Image from 'next/image'
import logo from 'public/horizontal-dark.png'
import { useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { ArrayFieldTemplate, DescriptionFieldTemplate, ObjectFieldTemplate } from 'src/Form/FormTemplates'
import { EntryInterface, SplitSchemaNoRender } from 'types/types'
import { widgets } from 'utils/formUtils'

type EntryCardHistoryDialogProps = {
  entry: EntryInterface
  splitSchema: SplitSchemaNoRender
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function ExportModelCardDialog({ entry, splitSchema, open, setOpen }: EntryCardHistoryDialogProps) {
  const theme = useTheme()
  const modelCardContentRef = useRef<HTMLDivElement>(null)
  const exportModelCard = useReactToPrint({
    content: () => modelCardContentRef.current,
    documentTitle: entry.name.replace(' ', '_'),
  })

  const handleExportOnClick = () => {
    if (modelCardContentRef) {
      exportModelCard()
    }
  }

  const steps = useMemo(() => {
    return splitSchema.steps.map((currentStep) => (
      <Form
        key={currentStep.section}
        schema={currentStep.schema}
        formData={currentStep.state}
        validator={validator}
        widgets={widgets}
        uiSchema={currentStep.uiSchema}
        liveValidate
        omitExtraData
        liveOmit
        formContext={{
          formSchema: currentStep.schema,
        }}
        templates={{
          DescriptionFieldTemplate,
          ArrayFieldTemplate,
          ObjectFieldTemplate,
        }}
      >
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <></>
      </Form>
    ))
  }, [splitSchema.steps])

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='md'>
      <DialogContent ref={modelCardContentRef}>
        <Stack spacing={2} divider={<Divider />}>
          <Stack direction='row' alignItems='center'>
            <Image src={logo} alt='podman-icon' width={180} height={70} />
            <Typography
              variant='h4'
              component='h1'
              sx={{ pl: 1 }}
              fontWeight='bold'
              color={theme.palette.secondary.main}
            >
              {entry.name}
            </Typography>
          </Stack>
          {steps}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
        <Button color='secondary' variant='contained' onClick={handleExportOnClick}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  )
}
