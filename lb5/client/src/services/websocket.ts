import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io('/', {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new WebSocketService();
