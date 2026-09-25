import Alert from '@mui/material/Alert'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { SchemaValidationErrorInfo } from 'utils/fetcher'

type SchemaValidationErrorAlertProps = {
  error: SchemaValidationErrorInfo | null
}

export default function SchemaValidationErrorAlert({ error }: SchemaValidationErrorAlertProps) {
  if (!error) {
    return null
  }

  return (
    <Alert severity='error' sx={{ my: 2 }}>
      <Stack spacing={1}>
        <Typography>{error.message}</Typography>
        {error.validationErrors.length > 0 && (
          <List dense disablePadding>
            {error.validationErrors.map(({ property, message, title }) => (
              <ListItem key={`${property}-${message}`} disablePadding>
                <Typography variant='body2'>
                  <strong>{title ?? property}</strong>: {message}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </Stack>
    </Alert>
  )
}
