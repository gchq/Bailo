import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import TextSchemaInput from './components/TextSchemaInput'
import BooleanSchemaInput from './components/BooleanSchemaInput'

export default function ComponentPicker() {
  return (
    <Box>
      <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
        <TextSchemaInput />
        <BooleanSchemaInput />
      </Stack>
    </Box>
  )
}
