import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OrderbookService } from './orderbook.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/orderbook', // you can use /ws/trading also
})
export class OrderbookGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('OrderbookGateway');

  constructor(private readonly orderbook: OrderbookService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ✅ Client requests current orderbook snapshot
  @SubscribeMessage('subscribeOrderbook')
  async handleSubscribe(@MessageBody() data: { symbol: string }) {
    const { symbol } = data;
    const book = await this.orderbook.ensureBook(symbol);
    this.server.emit(`orderbook:${symbol}`, book);
    this.logger.log(`Sent snapshot for ${symbol}`);
  }

  // ✅ Emit update event to all clients (called from OrderbookService)
  emitOrderbookUpdate(symbol: string, book: any) {
    this.server.emit(`orderbook:${symbol}`, book);
  }

  // ✅ Emit trade event to all clients
  emitTrade(symbol: string, trade: any) {
    this.server.emit(`trade:${symbol}`, trade);
  }
}
