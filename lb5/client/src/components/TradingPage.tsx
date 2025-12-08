import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { RootState, AppDispatch } from '../store';
import {
  fetchTradingSettings,
  updateTradingSettings,
  startTrading,
  stopTrading,
  fetchCurrentPrices,
  updatePricesFromSocket,
} from '../store/tradingSlice';
import websocketService from '../services/websocket';

const TradingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, currentPrices, loading, error } = useSelector(
    (state: RootState) => state.trading
  );

  const [startDate, setStartDate] = useState('2021-01-01');
  const [speedSeconds, setSpeedSeconds] = useState('1');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(fetchTradingSettings());
    dispatch(fetchCurrentPrices());

    // Подключаемся к WebSocket
    const socket = websocketService.connect();

    // Слушаем обновления цен
    socket?.on('priceUpdate', (data: any) => {
      dispatch(updatePricesFromSocket(data));
    });

    return () => {
      websocketService.disconnect();
    };
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setStartDate(settings.startDate);
      setSpeedSeconds(settings.speedSeconds.toString());
    }
  }, [settings]);

  const handleUpdateSettings = async () => {
    const speed = parseFloat(speedSeconds);
    
    if (isNaN(speed) || speed <= 0) {
      setValidationError('Скорость должна быть больше 0');
      return;
    }

    try {
      await dispatch(
        updateTradingSettings({ startDate, speedSeconds: speed })
      ).unwrap();
      setValidationError('');
    } catch (err) {
      setValidationError('Ошибка при обновлении настроек');
    }
  };

  const handleStartTrading = async () => {
    try {
      await dispatch(startTrading()).unwrap();
    } catch (err) {
      setValidationError('Ошибка при запуске торгов');
    }
  };

  const handleStopTrading = async () => {
    try {
      await dispatch(stopTrading()).unwrap();
    } catch (err) {
      setValidationError('Ошибка при остановке торгов');
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Настройки и Торги
      </Typography>

      {(error || validationError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || validationError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Настройки Биржи
            </Typography>

            <TextField
              fullWidth
              label="Дата начала торгов"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              disabled={settings?.isTrading}
            />

            <TextField
              fullWidth
              label="Скорость смены дат (секунды)"
              type="number"
              value={speedSeconds}
              onChange={(e) => setSpeedSeconds(e.target.value)}
              sx={{ mb: 2 }}
              disabled={settings?.isTrading}
            />

            <Button
              fullWidth
              variant="outlined"
              onClick={handleUpdateSettings}
              disabled={settings?.isTrading || loading}
            >
              Обновить настройки
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartTrading}
                disabled={settings?.isTrading || loading}
              >
                Начать торги
              </Button>

              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStopTrading}
                disabled={!settings?.isTrading || loading}
              >
                Остановить
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статус торгов
              </Typography>
              <Typography variant="body1">
                <strong>Статус:</strong>{' '}
                {settings?.isTrading ? (
                  <span style={{ color: 'green' }}>🟢 Активны</span>
                ) : (
                  <span style={{ color: 'red' }}>🔴 Остановлены</span>
                )}
              </Typography>
              <Typography variant="body1">
                <strong>Текущая дата торгов:</strong> {settings?.currentDate || '-'}
              </Typography>
            </CardContent>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Текущие цены акций
            </Typography>

            {currentPrices.length === 0 ? (
              <Alert severity="info">
                Нет выбранных акций для торгов. Выберите акции на странице "Акции".
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Символ</TableCell>
                      <TableCell align="right">Цена</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPrices.map((price) => (
                      <TableRow key={price.symbol}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {price.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" color="primary" fontWeight="bold">
                            ${price.price.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingPage;
