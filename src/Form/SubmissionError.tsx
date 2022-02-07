import Alert from '@mui/material/Alert'

export default function SubmissionError({ error }: { error?: string }) {
  return (
    <>
      {error && (
        <Alert severity='error' sx={{ mb: 2, mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  )
}
