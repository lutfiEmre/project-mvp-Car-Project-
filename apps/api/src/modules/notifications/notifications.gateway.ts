import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string[]> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      const userSockets = this.connectedUsers.get(userId) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(userId, userSockets);

      client.join(`user:${userId}`);
      
      console.log(`User ${userId} connected via WebSocket`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const userSockets = this.connectedUsers.get(userId) || [];
      const filtered = userSockets.filter(id => id !== client.id);
      
      if (filtered.length > 0) {
        this.connectedUsers.set(userId, filtered);
      } else {
        this.connectedUsers.delete(userId);
      }
      
      console.log(`User ${userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendNewInquiry(dealerId: string, inquiry: any) {
    this.sendToUser(dealerId, 'new_inquiry', inquiry);
  }

  sendInquiryReply(userId: string, reply: any) {
    this.sendToUser(userId, 'inquiry_reply', reply);
  }

  sendNotification(userId: string, notification: any) {
    this.sendToUser(userId, 'notification', notification);
  }

  sendMessageRead(userId: string, inquiryId: string, readBy: 'user' | 'dealer') {
    this.sendToUser(userId, 'message_read', { inquiryId, readBy });
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

