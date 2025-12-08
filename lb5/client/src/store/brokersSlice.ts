import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as api from '../services/api';

export interface Broker {
  id: string;
  name: string;
  initialFunds: number;
  currentFunds: number;
  portfolio: { [stockSymbol: string]: number };
}

interface BrokersState {
  brokers: Broker[];
  loading: boolean;
  error: string | null;
}

const initialState: BrokersState = {
  brokers: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchBrokers = createAsyncThunk('brokers/fetchAll', async () => {
  return await api.getBrokers();
});

export const createBroker = createAsyncThunk(
  'brokers/create',
  async (data: { name: string; initialFunds: number }) => {
    return await api.createBroker(data);
  }
);

export const updateBroker = createAsyncThunk(
  'brokers/update',
  async ({ id, data }: { id: string; data: { name?: string; initialFunds?: number } }) => {
    return await api.updateBroker(id, data);
  }
);

export const deleteBroker = createAsyncThunk('brokers/delete', async (id: string) => {
  await api.deleteBroker(id);
  return id;
});

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch brokers
    builder.addCase(fetchBrokers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBrokers.fulfilled, (state, action: PayloadAction<Broker[]>) => {
      state.loading = false;
      state.brokers = action.payload;
    });
    builder.addCase(fetchBrokers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch brokers';
    });

    // Create broker
    builder.addCase(createBroker.fulfilled, (state, action: PayloadAction<Broker>) => {
      state.brokers.push(action.payload);
    });

    // Update broker
    builder.addCase(updateBroker.fulfilled, (state, action: PayloadAction<Broker>) => {
      const index = state.brokers.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.brokers[index] = action.payload;
      }
    });

    // Delete broker
    builder.addCase(deleteBroker.fulfilled, (state, action: PayloadAction<string>) => {
      state.brokers = state.brokers.filter((b) => b.id !== action.payload);
    });
  },
});

export default brokersSlice.reducer;
