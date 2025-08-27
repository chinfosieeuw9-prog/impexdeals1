import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: { primary: string; card: string; dark: string; brand: string; brandAlt: string };
  }
  interface PaletteOptions {
    gradient?: { primary: string; card: string; dark: string; brand: string; brandAlt: string };
  }
}

export const buildTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#1f6fd6' },
    secondary: { main: '#3a7bd5' },
    gradient: {
  primary: 'linear-gradient(135deg,#bfd2e9 0%,#96b7d4 24%,#436183 50%,#38536f 66%,#4a5f78 85%,#58718a 100%)',
      card: 'linear-gradient(135deg,#f8fbff 0%,#e3f0ff 100%)',
      dark: 'linear-gradient(180deg,#232526 0%,#414345 100%)',
      brand: 'linear-gradient(135deg,#1f6fd6 0%,#3a7bd5 55%,#4fa3ff 100%)',
      brandAlt: 'linear-gradient(135deg,#4fa3ff 0%,#3a7bd5 45%,#1f6fd6 100%)'
    },
    background: {
      default: mode === 'light' ? '#f5f8fc' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
    }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Roboto, Inter, Arial, sans-serif',
    h5: { fontWeight: 700 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, transition: 'transform .25s, box-shadow .25s' }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform .25s, box-shadow .25s' }
      }
    }
  }
});
