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
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
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

// Create a theme instance.
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fwwt53',
      contrastText: "#fff",
    },
    secondary: {
      main: '#f37f58',
    },
    error: {
      main: red.A400,
    },
    background: {
      paper: '#242424',
    },
    action: {
      active: '#fff',
      hover:'#fff',
      focus:'#fff',
      selected:'#fff',
    },
  },
})
