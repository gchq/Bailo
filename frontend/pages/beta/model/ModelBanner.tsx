import Container from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import * as React from 'react'

export default function ModelBanner() {
  return (
    <Paper
      sx={{
        backgroundColor: 'secondary',
        color: 'black',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      <Container maxWidth='xl'>
        <Typography>This model needs approving</Typography>
      </Container>
      <Button
        variant='contained'
        style={{
          maxWidth: '600px',
          maxHeight: '20px',
          minWidth: '60px',
          minHeight: '20px',
        }}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onClick={() => {}}
      >
        Review
      </Button>
    </Paper>
  )
}
