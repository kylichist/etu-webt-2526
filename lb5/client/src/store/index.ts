import { configureStore } from '@reduxjs/toolkit';
import brokersReducer from './brokersSlice';
import stocksReducer from './stocksSlice';
import tradingReducer from './tradingSlice';

export const store = configureStore({
  reducer: {
    brokers: brokersReducer,
    stocks: stocksReducer,
    trading: tradingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
