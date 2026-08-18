import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Paper, Stack } from '@mui/material'
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
  draftSuccessText?: string
  /** When true the form and action buttons are hidden; only children are shown inside the Paper. */
  hideForm?: boolean
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
  draftSuccessText = '',
  hideForm = false,
  children,
}: SchemaFormPageProps) {
  return (
    <>
      <Title text={title} />
      {isLoading && <Loading />}
      {!isLoading && (
        <Container maxWidth='lg'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
            {children}
            {!hideForm && (
              <Stack spacing={4}>
                <Link href={backHref}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    {backLabel}
                  </Button>
                </Link>
                <JsonSchemaForm
                  splitSchema={splitSchema}
                  setSplitSchema={setSplitSchema}
                  canEdit
                  displayLabelValidation={formValidationErrorState}
                />
                <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                  <Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    {onSaveDraft && (
                      <Button
                        sx={{ width: 'fit-content' }}
                        variant='outlined'
                        onClick={onSaveDraft}
                        loading={draftButtonLoading}
                        disabled={submitButtonLoading}
                      >
                        Save draft
                      </Button>
                    )}
                    <Button
                      sx={{ width: 'fit-content' }}
                      variant='contained'
                      onClick={onSubmit}
                      loading={submitButtonLoading}
                      disabled={draftButtonLoading}
                    >
                      Submit
                    </Button>
                  </Stack>
                  <MessageAlert message={errorText} severity='error' />
                  {onSaveDraft && <MessageAlert message={draftSuccessText} severity='success' />}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Container>
      )}
    </>
  )
}
