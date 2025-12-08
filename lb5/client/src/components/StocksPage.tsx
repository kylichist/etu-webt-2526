import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { fetchStocks, toggleStockSelection, Stock } from '../store/stocksSlice';
import StockChart from './StockChart';

const StocksPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { stocks, loading, error } = useSelector((state: RootState) => state.stocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    dispatch(fetchStocks());
  }, [dispatch]);

  const handleToggle = async (stock: Stock) => {
    await dispatch(
      toggleStockSelection({ id: stock.id, selected: !stock.selected })
    );
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Управление Акциями
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Список акций" />
        <Tab label="Графики" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Typography variant="body2" fontWeight="bold">
                    Выбрать
                  </Typography>
                </TableCell>
                <TableCell>Символ</TableCell>
                <TableCell>Название компании</TableCell>
                <TableCell align="right">Исторических записей</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : stocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Нет акций
                  </TableCell>
                </TableRow>
              ) : (
                stocks.map((stock) => (
                  <TableRow
                    key={stock.id}
                    hover
                    onClick={() => handleToggle(stock)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={stock.selected}
                        onChange={() => handleToggle(stock)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {stock.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell align="right">
                      {stock.historicalData.length}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Box>
          {stocks.length === 0 ? (
            <Alert severity="info">Нет акций для отображения</Alert>
          ) : (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {stocks.map((stock) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={stock.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        bgcolor:
                          selectedStock?.id === stock.id ? 'primary.light' : 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => setSelectedStock(stock)}
                    >
                      <CardContent>
                        <Typography variant="h6">{stock.symbol}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stock.name}
                        </Typography>
                        {stock.selected && (
                          <Typography variant="caption" color="primary">
                            ✓ Выбрана для торгов
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {selectedStock && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    {selectedStock.name} ({selectedStock.symbol})
                  </Typography>
                  <StockChart stock={selectedStock} />
                </Paper>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default StocksPage;
