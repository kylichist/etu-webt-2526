import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { RootState, AppDispatch } from '../store';
import {
  fetchBrokers,
  createBroker,
  updateBroker,
  deleteBroker,
  Broker,
} from '../store/brokersSlice';

const BrokersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { brokers, loading, error } = useSelector((state: RootState) => state.brokers);

  const [open, setOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [name, setName] = useState('');
  const [initialFunds, setInitialFunds] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const handleOpen = (broker?: Broker) => {
    if (broker) {
      setEditingBroker(broker);
      setName(broker.name);
      setInitialFunds(broker.initialFunds.toString());
    } else {
      setEditingBroker(null);
      setName('');
      setInitialFunds('');
    }
    setValidationError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBroker(null);
    setName('');
    setInitialFunds('');
    setValidationError('');
  };

  const handleSubmit = async () => {
    // Валидация
    if (!name.trim()) {
      setValidationError('Имя не может быть пустым');
      return;
    }

    const funds = parseFloat(initialFunds);
    if (isNaN(funds) || funds <= 0) {
      setValidationError('Сумма должна быть больше 0');
      return;
    }

    try {
      if (editingBroker) {
        await dispatch(
          updateBroker({
            id: editingBroker.id,
            data: { name, initialFunds: funds },
          })
        ).unwrap();
      } else {
        await dispatch(createBroker({ name, initialFunds: funds })).unwrap();
      }
      handleClose();
    } catch (err) {
      setValidationError('Ошибка при сохранении');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого брокера?')) {
      await dispatch(deleteBroker(id));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Управление Брокерами
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Добавить брокера
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell align="right">Начальный капитал</TableCell>
              <TableCell align="right">Текущий капитал</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {loading ? 'Загрузка...' : 'Нет брокеров'}
                </TableCell>
              </TableRow>
            ) : (
              brokers.map((broker) => (
                <TableRow key={broker.id}>
                  <TableCell>{broker.name}</TableCell>
                  <TableCell align="right">
                    ${broker.initialFunds.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    ${broker.currentFunds.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen(broker)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(broker.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBroker ? 'Редактировать брокера' : 'Добавить брокера'}
        </DialogTitle>
        <DialogContent>
          {validationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validationError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Имя брокера"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Начальный капитал ($)"
            type="number"
            fullWidth
            variant="outlined"
            value={initialFunds}
            onChange={(e) => setInitialFunds(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBroker ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrokersPage;
