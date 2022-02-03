import { createTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

export interface Theme {
  palette: {
    primary: {
      main: string
    }
    secondary: {
      main: string
    }
    error: {
      main: string
    }
  }
}

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#27598e',
    },
    secondary: {
      main: '#f37f58',
    },
    error: {
      main: red.A400,
    },
  },
})

export default theme
