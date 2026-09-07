import { Form } from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import { useMemo } from 'react'
import ExportPreviewDialog from 'src/common/ExportPreviewDialog'
import { ArrayFieldTemplate, DescriptionFieldTemplate, ObjectFieldTemplate } from 'src/Form/FormTemplates'
import { EntryInterface, SplitSchemaNoRender } from 'types/types'
import { widgets } from 'utils/formUtils'

type ExportEntryCardDialogProps = {
  entry: EntryInterface
  splitSchema: SplitSchemaNoRender
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function ExportEntryCardDialog({ entry, splitSchema, open, setOpen }: ExportEntryCardDialogProps) {
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
        <></>
      </Form>
    ))
  }, [splitSchema.steps])

  return (
    <ExportPreviewDialog open={open} setOpen={setOpen} documentTitle={entry.name}>
      {steps}
    </ExportPreviewDialog>
  )
}
