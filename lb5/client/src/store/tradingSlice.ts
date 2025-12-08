import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../services/api';

export interface TradingSettings {
  startDate: string;
  speedSeconds: number;
  isTrading: boolean;
  currentDate: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  date: string;
}

interface TradingState {
  settings: TradingSettings | null;
  currentPrices: StockPrice[];
  loading: boolean;
  error: string | null;
}

const initialState: TradingState = {
  settings: null,
  currentPrices: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchTradingSettings = createAsyncThunk('trading/fetchSettings', async () => {
  return await api.getTradingSettings();
});

export const updateTradingSettings = createAsyncThunk(
  'trading/updateSettings',
  async (data: { startDate?: string; speedSeconds?: number }) => {
    return await api.updateTradingSettings(data);
  }
);

export const startTrading = createAsyncThunk('trading/start', async () => {
  await api.startTrading();
  return await api.getTradingSettings();
});

export const stopTrading = createAsyncThunk('trading/stop', async () => {
  await api.stopTrading();
  return await api.getTradingSettings();
});

export const fetchCurrentPrices = createAsyncThunk('trading/fetchPrices', async () => {
  return await api.getCurrentPrices();
});

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // Обновление цен из WebSocket
    updatePricesFromSocket: (
      state,
      action: PayloadAction<{ prices: StockPrice[]; currentDate: string }>
    ) => {
      state.currentPrices = action.payload.prices;
      if (state.settings) {
        state.settings.currentDate = action.payload.currentDate;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch settings
    builder.addCase(fetchTradingSettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchTradingSettings.fulfilled,
      (state, action: PayloadAction<TradingSettings>) => {
        state.loading = false;
        state.settings = action.payload;
      }
    );
    builder.addCase(fetchTradingSettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch settings';
    });

    // Update settings
    builder.addCase(
      updateTradingSettings.fulfilled,
      (state, action: PayloadAction<TradingSettings>) => {
        state.settings = action.payload;
      }
    );

    // Start trading
    builder.addCase(startTrading.fulfilled, (state, action: PayloadAction<TradingSettings>) => {
      state.settings = action.payload;
    });

    // Stop trading
    builder.addCase(stopTrading.fulfilled, (state, action: PayloadAction<TradingSettings>) => {
      state.settings = action.payload;
    });

    // Fetch current prices
    builder.addCase(
      fetchCurrentPrices.fulfilled,
      (state, action: PayloadAction<StockPrice[]>) => {
        state.currentPrices = action.payload;
      }
    );
  },
});

export const { updatePricesFromSocket } = tradingSlice.actions;
export default tradingSlice.reducer;
