import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Box } from '@mui/material';
import Navigation from './components/Navigation';
import BrokersPage from './components/BrokersPage';
import StocksPage from './components/StocksPage';
import TradingPage from './components/TradingPage';

// Создаем кастомную тему Material UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Routes>
            <Route path="/" element={<BrokersPage />} />
            <Route path="/brokers" element={<BrokersPage />} />
            <Route path="/stocks" element={<StocksPage />} />
            <Route path="/trading" element={<TradingPage />} />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
