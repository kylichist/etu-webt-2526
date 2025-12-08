import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Brokers API
export const getBrokers = async () => {
  const response = await api.get('/brokers');
  return response.data;
};

export const createBroker = async (data: { name: string; initialFunds: number }) => {
  const response = await api.post('/brokers', data);
  return response.data;
};

export const updateBroker = async (
  id: string,
  data: { name?: string; initialFunds?: number }
) => {
  const response = await api.put(`/brokers/${id}`, data);
  return response.data;
};

export const deleteBroker = async (id: string) => {
  const response = await api.delete(`/brokers/${id}`);
  return response.data;
};

// Stocks API
export const getStocks = async () => {
  const response = await api.get('/stocks');
  return response.data;
};

export const updateStockSelection = async (id: string, selected: boolean) => {
  const response = await api.put(`/stocks/${id}/selection`, { selected });
  return response.data;
};

// Trading API
export const getTradingSettings = async () => {
  const response = await api.get('/trading/settings');
  return response.data;
};

export const updateTradingSettings = async (data: {
  startDate?: string;
  speedSeconds?: number;
}) => {
  const response = await api.put('/trading/settings', data);
  return response.data;
};

export const startTrading = async () => {
  const response = await api.post('/trading/start');
  return response.data;
};

export const stopTrading = async () => {
  const response = await api.post('/trading/stop');
  return response.data;
};

export const getCurrentPrices = async () => {
  const response = await api.get('/trading/prices');
  return response.data;
};
