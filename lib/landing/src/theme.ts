import { Roboto } from '@next/font/google'
import { createTheme } from '@mui/material/styles'
import { red } from '@mui/material/colors'

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
})

// Create a theme instance.
const theme = createTheme({
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
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
})

export default theme
