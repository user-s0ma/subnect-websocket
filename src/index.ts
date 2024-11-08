import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { connect } from "@tidbcloud/serverless";
import checkAuth from "@/checkAuth";

interface WebSocketSession {
  quit?: boolean;
  [key: string]: any;
};

interface Env {
  WEBSOCKET: DurableObjectNamespace;
  DATABASE_URL: string;
  WEBSOCKET_SECRET: string;
};

export default {
  async fetch(request: Request, env: Env) {
    try {
      switch (request.method) {
        case "GET": {
          const connection = connect({ url: env.DATABASE_URL });
          const adapter = new PrismaTiDBCloud(connection);
          const prisma = new PrismaClient({ adapter });
          const { profileId } = await checkAuth(request, prisma);
    
    
          if (profileId) {
            const id = env.WEBSOCKET.idFromName(profileId);
            const roomObject = env.WEBSOCKET.get(id);
    
            const url = new URL(request.url);
            return roomObject.fetch(url.toString(), request);
          }
        };
        default:
          return new Response("Not found", { status: 404 });
      };
    } catch (error) {
      console.error(error);
      return new Response("Internal server error", { status: 500 });
    }
  }
};

export class WebSocketServer {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, WebSocketSession>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map();

    this.state.getWebSockets().forEach((webSocket: WebSocket) => {
      const meta = (webSocket as any).deserializeAttachment();
      this.sessions.set(webSocket, { ...meta });
    });
  };

  async fetch(request: Request): Promise<Response> {
    switch (request.method) {
      case "GET": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        };

        const pair = new WebSocketPair();
        await this.handleSession(pair[1]);
        console.log("response");
        return new Response(null, { status: 101, webSocket: pair[0] });
      };
      case "POST": {
        const message: any = await request.json();
        this.broadcast(message);
        return new Response("Message sent", { status: 200 });
      };
      default:
        return new Response("Not found", { status: 404 });
    };
  };

  private async handleSession(webSocket: WebSocket): Promise<void> {
    this.state.acceptWebSocket(webSocket);
    const session: WebSocketSession = {};
    this.sessions.set(webSocket, session);
  };

  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    this.sessions.delete(webSocket);
  };

  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    this.sessions.delete(webSocket);
  };

  broadcast(message: any): void {
    const messageString = JSON.stringify(message);
    this.sessions.forEach((session: WebSocketSession, webSocket: WebSocket) => {
      webSocket.send(messageString);
    });
  };
};