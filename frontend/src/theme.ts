import { green, red, yellow } from '@mui/material/colors'
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles'

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    container: PaletteColor
    customTextInput: PaletteColor
    topNavigation: PaletteColor
  }
  interface PaletteOptions {
    container: PaletteColorOptions
    customTextInput: PaletteColorOptions
    topNavigation: PaletteColorOptions
  }
}

const defaultComponentOverrides: ThemeOptions['components'] = {
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
      variant: 'outlined',
    },
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
  },
}

export interface ThemeMapping {
  key: string
  theme: Theme
}

export const lightTheme = createTheme({
  components: {
    ...defaultComponentOverrides,
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        button: {
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderRight: 'solid',
            borderWidth: '2px',
            borderColor: '#f7a4c0',
          },
          '&.Mui-selected': {
            borderRight: 'solid',
            borderWidth: '2px',
            borderColor: '#d62560',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#54278e',
    },
    secondary: {
      main: '#d62560',
    },
    error: {
      main: red.A400,
    },
    container: {
      main: '#f3f1f1',
    },
    customTextInput: {
      main: '#535353',
    },
    topNavigation: {
      main: '#fff',
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
    customTextInput: {
      main: '#c8c8c8',
    },
    topNavigation: {
      main: '#fff',
    },
  },
  components: {
    ...defaultComponentOverrides,
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
            borderRight: 'solid',
            borderWidth: '2px',
            borderColor: '#f7a4c0',
          },
          '&.Mui-selected': {
            borderRight: 'solid',
            borderWidth: '2px',
            borderColor: '#d62560',
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

export const ThemeName = {
  Light: 'light',
  Dark: 'dark',
} as const

const lightThemeMapping = {
  key: ThemeName.Light,
  theme: lightTheme,
  title: 'Light',
}
const darkThemeMapping = {
  key: ThemeName.Dark,
  theme: darkTheme,
  title: 'Dark',
}

export const themeList = [lightThemeMapping, darkThemeMapping]
