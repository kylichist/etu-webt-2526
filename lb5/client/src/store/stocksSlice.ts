import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../services/api';

export interface HistoricalDataPoint {
  date: string;
  open: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  selected: boolean;
  historicalData: HistoricalDataPoint[];
}

interface StocksState {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
}

const initialState: StocksState = {
  stocks: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchStocks = createAsyncThunk('stocks/fetchAll', async () => {
  return await api.getStocks();
});

export const toggleStockSelection = createAsyncThunk(
  'stocks/toggleSelection',
  async ({ id, selected }: { id: string; selected: boolean }) => {
    return await api.updateStockSelection(id, selected);
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch stocks
    builder.addCase(fetchStocks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStocks.fulfilled, (state, action: PayloadAction<Stock[]>) => {
      state.loading = false;
      state.stocks = action.payload;
    });
    builder.addCase(fetchStocks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch stocks';
    });

    // Toggle selection
    builder.addCase(toggleStockSelection.fulfilled, (state, action: PayloadAction<Stock>) => {
      const index = state.stocks.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.stocks[index] = action.payload;
      }
    });
  },
});

export default stocksSlice.reducer;
