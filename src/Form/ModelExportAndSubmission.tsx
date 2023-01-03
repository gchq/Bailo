import React, { Dispatch, SetStateAction, createRef, useState } from 'react'
import Download from '@mui/icons-material/Download'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Upload from '@mui/icons-material/Upload'
import LoadingButton from '@mui/lab/LoadingButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useGetUiConfig } from '../../data/uiConfig'
import ModelOverview from '../ModelOverview'
import { SplitSchema } from '../../types/interfaces'
import { consoleWarn } from '../../utils/logging'

const downloadToFile = (blob, filename) => {
  const a = document.createElement('a')

  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()

  URL.revokeObjectURL(a.href)
}

function ModelExportAndSubmission({
  formData,
  schemaRef,
  splitSchema,
  onSubmit,
  activeStep,
  setActiveStep,
  modelUploading,
}: {
  formData: any
  schemaRef: string
  splitSchema: SplitSchema
  onSubmit: any
  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>
  modelUploading: boolean
}) {
  const [ref] = useState<any>(createRef())
  const [wrappedMetadata, setWrappedMetadata] = useState<any>({ metadata: {} })
  const [showHtmlView, setShowHtmlView] = useState<boolean>(false)
  const [warningCheckboxVal, setWarningCheckboxVal] = useState<boolean>(false)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const getGlobalCss = () => {
    const css: Array<string> = []

    for (const sheet of document.styleSheets as unknown as Array<CSSStyleSheet>) {
      try {
        const rules = 'cssRules' in sheet ? sheet.cssRules : sheet.rules
        if (rules) {
          css.push(`\n/* Stylesheet : ${sheet.href || '[inline styles]'} */`)
          for (const rule of rules as any) {
            if ('cssText' in rule) {
              css.push(rule.cssText)
            } else {
              const styleRule = rule as CSSStyleRule
              css.push(`${styleRule.selectorText} {\n${styleRule.style.cssText}\n}\n`)
            }
          }
        }
      } catch (e) {
        consoleWarn('CSS rules could not be loaded.')
      }
    }
    return `${css.join('\n')}\n`
  }

  const onShowHtmlView = () => {
    const defaults = {}
    splitSchema.steps.forEach((step) => {
      defaults[step.section] = {}
    })

    setWrappedMetadata({
      metadata: {
        ...defaults,
        ...formData,
        schemaRef,
      },
    })
    setShowHtmlView(true)
  }

  const handleClose = () => {
    setShowHtmlView(false)
  }

  const handleModelClose = () => setShowHtmlView(false)

  const exportElement = () => {
    if (formData?.highLevelDetails?.name !== undefined || formData.highLevelDetails.name !== '') {
      if (!ref) throw new Error('Called before DOM loaded')
      const blob = new Blob(
        [
          `<!doctype html>
          <html>
            <head>
              <title>Model card HTML for ${formData.highLevelDetails.name}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>${getGlobalCss()}</style>
            </head>
            <body>${ref.current.outerHTML}</body>
          </html>
        `,
        ],
        { type: 'text/html;charset=utf-8' }
      )
      downloadToFile(blob, `${formData.highLevelDetails.name}.html`)
    }
  }

  const handleCheckboxChange = (e) => {
    setWarningCheckboxVal(e.target.checked)
  }

  if (isUiConfigError || isUiConfigLoading || !uiConfig) {
    return null
  }

  return (
    <>
      <Grid container justifyContent='center'>
        {uiConfig.uploadWarning.showWarning && (
          <Alert sx={{ width: '100%' }} severity={warningCheckboxVal ? 'success' : 'warning'}>
            <Checkbox size='small' checked={warningCheckboxVal} onChange={handleCheckboxChange} sx={{ p: 0, mr: 1 }} />
            {uiConfig.uploadWarning.checkboxText}
          </Alert>
        )}
        <Stack direction='row' spacing={2} sx={{ mt: 5, mb: 5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <OpenInNew color='primary' sx={{ pt: 1, color: 'primary', fontSize: 75 }} />
            <Typography sx={{ p: 1 }} variant='h6'>
              Export as HTML
            </Typography>
            <Typography sx={{ p: 1, mb: 1.5 }} variant='body1' component='p'>
              Click below to render your metadata in a HTML component.
            </Typography>
            <Button variant='text' onClick={onShowHtmlView}>
              View
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Download color='primary' sx={{ pt: 1, color: 'primary', fontSize: 75 }} />
            <Typography sx={{ p: 1 }} variant='h6'>
              Export as JSON
            </Typography>
            <Typography sx={{ p: 1, mb: 1.5 }} variant='body1' component='p'>
              Click below to download your metadata as a JSON file for easy distribution.
            </Typography>
            <Button
              aria-label='download JSON'
              href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(formData, null, 2))}`}
              download={`${formData?.highLevelDetails?.name}.json`}
              variant='text'
            >
              Download
            </Button>
          </Box>
          <Divider orientation='vertical' flexItem>
            OR
          </Divider>
          <Box sx={{ textAlign: 'center' }}>
            <Upload color='primary' sx={{ pt: 1, color: 'primary', fontSize: 75 }} />
            <Typography sx={{ p: 1 }} variant='h6'>
              Upload Model
            </Typography>
            <Typography sx={{ p: 1, mb: 1.5 }} variant='body1' component='p'>
              If you are happy with your submission click below to upload your model to Bailo.
            </Typography>
            <LoadingButton
              onClick={onSubmit}
              loading={modelUploading}
              variant='contained'
              disabled={uiConfig.uploadWarning.showWarning && !warningCheckboxVal}
            >
              Submit
            </LoadingButton>
          </Box>
        </Stack>
      </Grid>
      <Box sx={{ textAlign: 'left' }}>
        <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)}>
          Previous Section
        </Button>
      </Box>
      <Dialog
        open={showHtmlView}
        onClose={handleModelClose}
        scroll='paper'
        fullWidth
        maxWidth='lg'
        aria-labelledby='html-view'
        aria-describedby='the-html-view-of-the-form-data'
      >
        <DialogTitle id='scroll-dialog-title'>
          Form data for {formData?.highLevelDetails?.name !== undefined ? formData.highLevelDetails.name : ''}
        </DialogTitle>
        <DialogContent dividers>
          <div id='html-content-wrapper' ref={ref} tabIndex={-1}>
            <Box sx={{ backgroundColor: '#e4e4e4', p: 2 }}>
              <Paper sx={{ p: 2, maxWidth: '800px', margin: 'auto' }}>
                <ModelOverview version={wrappedMetadata} />
              </Paper>
            </Box>
          </div>
        </DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={handleClose}>
            Close
          </Button>
          <Button variant='contained' onClick={exportElement}>
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ModelExportAndSubmission
