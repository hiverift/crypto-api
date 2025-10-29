
import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/market', cors: { origin: '*' } })
export class MarketGateway {
  @WebSocketServer() server: Server;
  private logger = new Logger('MarketGateway');
  handleConnection(client: Socket){ this.logger.log('connected '+client.id); }
  handleDisconnect(client: Socket){ this.logger.log('disconnected '+client.id); }
  @SubscribeMessage('subscribe') handleSubscribe(client: Socket, payload:any){ client.join(payload.symbol); client.emit('subscribed', payload.symbol); }
}
