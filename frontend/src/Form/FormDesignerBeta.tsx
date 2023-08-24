import { Grid, StepLabel } from '@mui/material'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'
import React, { Dispatch, SetStateAction, useState } from 'react'
import Nothing from 'src/MuiForms/Nothing'

import { SplitSchema } from '../../types/interfaces'

export default function FormDesigner({
  splitSchema,
  setSplitSchema,
  onSubmit,
  modelUploading,
  canEdit = false,
}: {
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  onSubmit: () => void
  modelUploading: boolean
  canEdit?: boolean
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
    <Grid container>
      <Grid item xs={3} lg={2} xl={1}>
        <Stepper
          id='form-page-stepper'
          sx={{ mt: 2, mb: 2 }}
          activeStep={activeStep}
          nonLinear
          alternativeLabel
          orientation='vertical'
          connector={<Nothing />}
        >
          {splitSchema.steps.map((step, index) => (
            <MaterialStep key={step.schema.title}>
              <StepButton sx={{ p: 0, m: 0 }} onClick={() => setActiveStep(index)} icon={<Nothing />}>
                <StepLabel
                  sx={{
                    padding: 0,
                    '& .Mui-active': {
                      borderBottomStyle: 'groove',
                    },
                  }}
                >
                  {step.schema.title}
                </StepLabel>
              </StepButton>
            </MaterialStep>
          ))}
        </Stepper>
      </Grid>

      <Grid item xs={9} lg={10} xl={11} sx={{ pt: 2 }}>
        <Render step={currentStep} splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={canEdit} />
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
          canEdit={canEdit}
        />
      </Grid>
    </Grid>
  )
}
