import { Box, Button, Stack, Typography } from '@mui/material'

interface EntryCardProps {
  title: string
  description: string
  handleClick: () => void
  dataTest?: string
  disabled?: boolean
  recommended?: boolean
}

export default function EntryCard({ title, description, dataTest, handleClick, recommended = false }: EntryCardProps) {
  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center'>
        <Stack spacing={1}>
          <Stack direction='row' spacing={1}>
            <Typography component='h2' fontWeight='bold' color='primary'>
              {title}
            </Typography>
            {recommended && (
              <Typography component='h2' fontWeight='bold' color='secondary'>
                (recommended)
              </Typography>
            )}
          </Stack>
          <Typography>{description}</Typography>
        </Stack>
        <Button
          sx={{ minWidth: '150px', height: 'fit-content' }}
          variant='contained'
          onClick={handleClick}
          data-test={dataTest}
        >
          Create
        </Button>
      </Stack>
    </Box>
  )
}
