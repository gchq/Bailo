import { Box, Stack } from '@mui/material'

interface ThemeCircleProps {
  colour: string
}

export default function ThemeSquare({ colour }: ThemeCircleProps) {
  return (
    <Stack spacing={2} alignItems='center'>
      <Box sx={{ height: '50px', width: '50px', backgroundColor: colour, display: 'inline-block' }}></Box>
    </Stack>
  )
}
