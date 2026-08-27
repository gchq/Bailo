import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Paper, Stack, Tooltip } from '@mui/material'
import { Dispatch, ReactNode, SetStateAction } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { SplitSchemaNoRender } from 'types/types'

type SchemaFormPageProps = {
  title: string
  isLoading: boolean
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  backHref: string
  backLabel: string
  onSubmit: () => void
  submitButtonLoading: boolean
  formValidationErrorState: boolean
  errorText: string
  onSaveDraft?: () => void
  draftButtonLoading?: boolean
  /** When true the form and action buttons are hidden; only children are shown inside the Paper. */
  hideForm?: boolean
  /** Tooltip shown on both disabled action buttons. Omit to leave buttons enabled. */
  disableActions?: string
  /** Optional content rendered inside the Paper before the form (e.g. a warning when no model card exists). */
  children?: ReactNode
}

export default function SchemaFormPage({
  title,
  isLoading,
  splitSchema,
  setSplitSchema,
  backHref,
  backLabel,
  onSubmit,
  submitButtonLoading,
  formValidationErrorState,
  errorText,
  onSaveDraft,
  draftButtonLoading = false,
  hideForm = false,
  disableActions,
  children,
}: SchemaFormPageProps) {
  const actionsDisabled = Boolean(disableActions)

  return (
    <>
      <Title text={title} />
      {isLoading && <Loading />}
      {!isLoading && (
        <Container maxWidth='lg'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={backHref}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                {backLabel}
              </Button>
            </Link>
            {children}
            {!hideForm && (
              <Stack spacing={4}>
                <JsonSchemaForm
                  splitSchema={splitSchema}
                  setSplitSchema={setSplitSchema}
                  canEdit
                  displayLabelValidation={formValidationErrorState}
                />
                <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                  <Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    {onSaveDraft && (
                      <Tooltip title={disableActions ?? ''}>
                        <span>
                          <Button
                            sx={{ width: 'fit-content' }}
                            variant='outlined'
                            onClick={onSaveDraft}
                            loading={draftButtonLoading}
                            disabled={submitButtonLoading || actionsDisabled}
                          >
                            Save draft
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip title={disableActions ?? ''}>
                      <span>
                        <Button
                          sx={{ width: 'fit-content' }}
                          variant='contained'
                          onClick={onSubmit}
                          loading={submitButtonLoading}
                          disabled={draftButtonLoading || actionsDisabled}
                        >
                          Submit
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                  <MessageAlert message={errorText} severity='error' />
                </Stack>
              </Stack>
            )}
          </Paper>
        </Container>
      )}
    </>
  )
}
