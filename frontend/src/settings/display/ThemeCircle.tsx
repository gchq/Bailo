import { Box, Stack } from '@mui/material'

interface ThemeCircleProps {
  colour: string
}

export default function ThemeCircle({ colour }: ThemeCircleProps) {
  return (
    <Stack spacing={2} alignItems='center'>
      <Box
        sx={{ height: '50px', width: '50px', backgroundColor: colour, borderRadius: '50%', display: 'inline-block' }}
      ></Box>
    </Stack>
  )
}
