import { green, red, yellow } from '@mui/material/colors'
import { createTheme, PaletteColor, PaletteColorOptions, ThemeOptions } from '@mui/material/styles'
import type {} from '@mui/x-date-pickers/themeAugmentation'

declare module '@mui/material/styles' {
  interface Palette {
    container: PaletteColor
    customTextInput: PaletteColor
    topNavigation: PaletteColor
    markdownBorder: PaletteColor
    vulnerabilityCritical: PaletteColor
    vulnerabilityHigh: PaletteColor
    vulnerabilityMedium: PaletteColor
    vulnerabilityLow: PaletteColor
  }
  interface PaletteOptions {
    container: PaletteColorOptions
    customTextInput: PaletteColorOptions
    topNavigation: PaletteColorOptions
    markdownBorder: PaletteColorOptions
    vulnerabilityCritical: PaletteColorOptions
    vulnerabilityHigh: PaletteColorOptions
    vulnerabilityMedium: PaletteColorOptions
    vulnerabilityLow: PaletteColorOptions
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
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },
  MuiMenu: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'left',
      },
      transformOrigin: {
        vertical: 'top',
        horizontal: 'left',
      },
      slotProps: {
        list: {
          dense: true,
        },
      },
    },
    styleOverrides: {
      root: {
        marginTop: 4,
      },
    },
  },
  MuiPickersOutlinedInput: {
    styleOverrides: {
      sectionsContainer: {
        paddingTop: 10,
        paddingBottom: 10,
      },
    },
  },
}

export const lightTheme = createTheme({
  typography: {
    caption: {
      fontSize: '0.9rem',
    },
  },
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
            borderColor: '#b5497d',
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
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#ececec',
          },
        },
      },
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#764591',
    },
    secondary: {
      main: '#b5497d',
    },
    error: {
      main: red.A700,
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
    info: {
      main: '#0288d1',
      light: '#e5f6fd',
    },
    warning: {
      main: '#C55302',
      light: '#ffd08b',
    },
    markdownBorder: {
      main: '#b8b8b8',
    },
    vulnerabilityCritical: {
      main: '#c62828',
      dark: '#a20202',
    },
    vulnerabilityHigh: {
      main: red.A700,
      dark: '#990000',
    },
    vulnerabilityMedium: {
      main: '#e65100',
      dark: '#bf4300',
    },
    vulnerabilityLow: {
      main: '#ff9800',
      dark: '#ce7b00',
    },
  },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f7f7f7',
      contrastText: '#fff',
    },
    secondary: {
      main: '#914581',
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
      paper: '#2d2d2d',
      default: '#2d2d2d',
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
    markdownBorder: {
      main: '#b8b8b8',
    },
    vulnerabilityCritical: {
      main: '#c62828',
    },
    vulnerabilityHigh: {
      main: red.A700,
    },
    vulnerabilityMedium: {
      main: '#e65100',
    },
    vulnerabilityLow: {
      main: '#ff9800',
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
            borderColor: '#b5497d',
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
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
        outlined: {
          color: '#fff',
        },
        contained: {
          color: '#fff',
          backgroundColor: '#914581',
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
          backgroundColor: 'white',
          color: '#2d2d2d',
        },
        deleteIcon: {
          color: '#3f3f3f',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#e3e3e3',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          color: '#e3e3e3',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&:hover': {
            backgroundColor: '#363636',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        div: {
          color: theme.palette.text.primary,
        },
      }),
    },
  },
})
