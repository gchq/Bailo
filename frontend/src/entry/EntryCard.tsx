import { Button, Card, Stack, Typography } from '@mui/material'

interface EntryCardProps {
  title: string
  description: string
  handleClick: () => void
  dataTest?: string
  disabled?: boolean
}

export default function EntryCard({ title, description, dataTest, handleClick }: EntryCardProps) {
  return (
    <Card
      sx={{
        width: '300px',
        p: 2,
        m: 2,
      }}
    >
      <Stack spacing={2} justifyContent='space-between' sx={{ height: '100%' }}>
        <Stack spacing={2}>
          <Typography component='h2' variant='h6' color='primary'>
            {title}
          </Typography>
          <Typography>{description}</Typography>
        </Stack>
        <Button fullWidth variant='contained' onClick={handleClick} data-test={dataTest}>
          Create
        </Button>
      </Stack>
    </Card>
  )
}
