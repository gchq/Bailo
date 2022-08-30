import Alert from '@mui/material/Alert'

export default function SubmissionError({ error }: { error?: string }) {
  if (!error) return null

  return (
    <Alert severity='error' sx={{ mb: 2, mt: 2 }}>
      {error}
    </Alert>
  )
}
