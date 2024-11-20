import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { connect } from "@tidbcloud/serverless";
import checkAuth from "@/checkAuth";

interface WebSocketSession {
  type: string;
  data: {
    profileId?: string;
    roomId?: string;
  };
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
            const url = new URL(request.url);
            const pathSegments = url.pathname.split("/").filter(Boolean);
            const type = pathSegments[pathSegments.length - 1] || "";

            const id = env.WEBSOCKET.idFromName(`${type}:${profileId}`);
            const roomObject = env.WEBSOCKET.get(id);

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
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Map();
    this.env = env;

    this.state.getWebSockets().forEach((webSocket: WebSocket) => {
      const meta = (webSocket as any).deserializeAttachment();
      this.sessions.set(webSocket, { ...meta });
    });
  };

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const type = pathSegments[pathSegments.length - 1] || "";

    switch (request.method) {
      case "GET": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        };

        let data: {} = {}
        switch (type) {
          case "calls": {
            const connection = connect({ url: this.env.DATABASE_URL });
            const adapter = new PrismaTiDBCloud(connection);
            const prisma = new PrismaClient({ adapter });
            const { profileId } = await checkAuth(request, prisma);
            const roomId = url.searchParams.get("roomId");
            data = { roomId, profileId };
          };
          default:
            data = {};
        };

        const pair = new WebSocketPair();
        await this.handleSession(pair[1], type, data);

        return new Response(null, { status: 101, webSocket: pair[0] });
      };
      case "POST": {
        const message: any = await request.json();

        this.broadcast(message, type);
        return new Response("Message sent", { status: 200 });
      };
      default:
        return new Response("Not found", { status: 404 });
    };
  };

  private async handleSession(
    webSocket: WebSocket,
    type: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    this.state.acceptWebSocket(webSocket);
    const session: WebSocketSession = { type, data };
    this.sessions.set(webSocket, session);
  };

  private async RoomDisconnect(session: WebSocketSession): Promise<void> {
    const connection = connect({ url: this.env.DATABASE_URL });
    const adapter = new PrismaTiDBCloud(connection);
    const prisma = new PrismaClient({ adapter });

    await prisma.roomMember.delete({
      where: {
        profileId_roomId: {
          profileId: session.data.profileId,
          roomId: session.data.roomId
        }
      }
    });
    this.broadcast({ type: "MEMBER_DISCONNECTED", profileId: session.data.profileId }, session.type);
  };

  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    const session = this.sessions.get(webSocket);

    if (session.type === "calls") {
      this.RoomDisconnect(session);
    };
    this.sessions.delete(webSocket);
  };

  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    const session = this.sessions.get(webSocket);

    if (session.type === "calls") {
      this.RoomDisconnect(session);
    };
    this.sessions.delete(webSocket);
  };

  broadcast(message: any, type: string): void {
    const messageString = JSON.stringify(message);
    this.sessions.forEach((session: WebSocketSession, webSocket: WebSocket) => {
      if (session.type === type) {
        webSocket.send(messageString);
      }
    });
  };
};