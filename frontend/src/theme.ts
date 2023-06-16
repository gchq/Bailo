import { green, red, yellow } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    container: PaletteColor
  }
  interface PaletteOptions {
    container?: PaletteColorOptions
  }
}

const removeElevation = {
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
    },
  },
}

export const lightTheme = createTheme({
  components: {
    ...removeElevation,
  },
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
    container: {
      main: '#f3f1f1',
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f37f58',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ecc3b1',
    },
    error: {
      main: red.A200,
    },
    info: {
      main: '#0288d1',
    },
    warning: {
      main: yellow.A700,
    },
    success: {
      main: green.A700,
    },
    background: {
      paper: '#242424',
    },
    action: {
      active: '#fff',
      hover: 'rgba(106, 106, 106, 0.16)',
      focus: 'rgba(106, 106, 106, 0.16)',
      selected: '#fff',
    },
    container: {
      main: '#5a5a5a',
    },
  },
  components: {
    ...removeElevation,
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        button: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        outlined: {
          color: '#fff',
        },
        contained: {
          color: '#fff',
        },
        text: {
          color: '#fff',
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          color: '#fff',
          '&:hover': {
            backgroundColor: '#5c5c5c',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        filled: {
          color: 'black',
        },
        deleteIcon: {
          color: '#3f3f3f',
        },
      },
    },
  },
})
