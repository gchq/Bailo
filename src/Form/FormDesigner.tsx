import Box from '@mui/material/Box'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import { Dispatch, SetStateAction, useState } from 'react'
import { SplitSchema } from '../../types/interfaces'

export default function FormDesigner({
  splitSchema,
  setSplitSchema,
  onSubmit,
  modelUploading,
}: {
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  onSubmit: () => void
  modelUploading: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [openValidateError, setOpenValidateError] = useState(false)

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const Render = currentStep.render
  const RenderButtons = currentStep.renderButtons

  return (
    <>
      <Stepper id='form-page-stepper' sx={{ mt: 4, mb: 4 }} activeStep={activeStep} nonLinear alternativeLabel>
        {splitSchema.steps.map((step, index) => (
          <MaterialStep key={step.schema.title}>
            <StepButton onClick={() => setActiveStep(index)}>{step.schema.title}</StepButton>
            {step.type !== 'Message' && (
              <Box sx={{ textAlign: 'center' }}>
                {step.isComplete(step) ? (
                  <Typography sx={{ color: 'green' }} variant='caption'>
                    Complete
                  </Typography>
                ) : (
                  <Typography sx={{ color: 'orange' }} variant='caption'>
                    In progress
                  </Typography>
                )}
              </Box>
            )}
          </MaterialStep>
        ))}
      </Stepper>

      <Render step={currentStep} splitSchema={splitSchema} setSplitSchema={setSplitSchema} />
      <RenderButtons
        step={currentStep}
        splitSchema={splitSchema}
        setSplitSchema={setSplitSchema}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        onSubmit={onSubmit}
        openValidateError={openValidateError}
        setOpenValidateError={setOpenValidateError}
        modelUploading={modelUploading}
      />
    </>
  )
}
