import { Box, Button, Stack, Typography } from '@mui/material'

interface EntryCardProps {
  title: string
  description: string
  handleClick: () => void
  dataTest?: string
  disabled?: boolean
  mostPopular?: boolean
}

export default function EntryCard({ title, description, dataTest, handleClick, mostPopular = false }: EntryCardProps) {
  return (
    <Box
      sx={{
        width: '100%',
      }}
    >
      <Stack direction='row' spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack spacing={1}>
          <Stack direction='row' spacing={1}>
            <Typography component='h2' sx={{ fontWeight: 'bold' }} color='primary'>
              {title}
            </Typography>
            {mostPopular && (
              <Typography component='h2' sx={{ fontWeight: 'bold' }} color='secondary'>
                (most popular)
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
