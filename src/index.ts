import checkAuth from "@/checkAuth";
import { getPrismaClient } from "./lib/db";

interface WebSocketSession {
  type: string;
  id: string;
  profileId?: string;
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
          const prisma = getPrismaClient(env);
          const { profileId } = await checkAuth(request, prisma);

          if (profileId) {
            const url = new URL(request.url);
            const pathSegments = url.pathname.split("/").filter(Boolean);
            const type = pathSegments[pathSegments.length - 1] || "";

            const id = url.searchParams.get("id") || profileId;
            
            switch (type) {
              case "rooms": {
                if (!id) {
                  return new Response("Room ID not provided", { status: 400 });
                };
                const member = await prisma.roomMember.findUnique({
                  where: {
                    profileId_roomId: {
                      profileId,
                      roomId: id
                    }
                  }
                });
                if (!member) {
                  return new Response("Not a member of this room", { status: 403 });
                };
                break;
              };
              default:
            };

            const wsId = env.WEBSOCKET.idFromName(`${type}:${id}`);
            const roomObject = env.WEBSOCKET.get(wsId);

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
    const prisma = getPrismaClient(this.env);
    const { profileId } = await checkAuth(request, prisma);

    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const type = pathSegments[pathSegments.length - 1] || "";

    const id = url.searchParams.get("id") || profileId;

    switch (request.method) {
      case "GET": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        };

        const pair = new WebSocketPair();
        await this.handleSession(pair[1], type, id, profileId);

        return new Response(null, { status: 101, webSocket: pair[0] });
      };
      case "POST": {
        const message: any = await request.json();

        this.broadcast(message, type, id);
        return new Response("Message sent", { status: 200 });
      };
      default:
        return new Response("Not found", { status: 404 });
    };
  };

  private async handleSession(
    webSocket: WebSocket,
    type: string,
    id: string,
    profileId: string,
  ): Promise<void> {
    const session: WebSocketSession = { type, id, profileId };
    (webSocket as any).serializeAttachment(session);
    this.state.acceptWebSocket(webSocket);
    this.sessions.set(webSocket, session);
  };

  private async roomDisconnect(session: WebSocketSession): Promise<void> {
    const prisma = getPrismaClient(this.env);

    const room = await prisma.room.findUnique({ where: { roomId: session.id } });

    const deletedMember = await prisma.roomMember.delete({
      where: {
        profileId_roomId: {
          profileId: session.profileId,
          roomId: session.id
        }
      }
    });

    if (room.profileId === session.profileId) {
      await prisma.room.delete({
        where: { roomId: session.id }
      });

      this.broadcast({ event: "ROOM_DELETED" }, "rooms", session.id);
    } else {
      this.broadcast({ event: "MEMBER_LEFT", profileId: session.profileId, sessionId: deletedMember.sessionId }, "rooms", session.id);
    };
  };

  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    const session = this.sessions.get(webSocket);

    if (session.type === "rooms") {
      //this.roomDisconnect(session);
    };
    this.sessions.delete(webSocket);
  };

  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    const session = this.sessions.get(webSocket);

    if (session.type === "rooms") {
      //this.roomDisconnect(session);
    };
    this.sessions.delete(webSocket);
  };

  broadcast(message: any, type: string, id: string): void {
    const messageString = JSON.stringify(message);
    this.sessions.forEach((session: WebSocketSession, webSocket: WebSocket) => {
      if (session.type === type && session.id === id) {
        webSocket.send(messageString);
      }
    });
  };
};