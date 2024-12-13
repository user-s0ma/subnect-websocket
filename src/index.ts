import checkAuth from "@/checkAuth";
import { getPrismaClient } from "./lib/db";

interface WebSocketSession {
  type: string;
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
              default:
                if (id !== profileId) {
                  return new Response("you do not have permission.", { status: 403 });
                };
            };

            const wsId = env.WEBSOCKET.idFromName(`${type}:${id}`);
            const roomObject = env.WEBSOCKET.get(wsId);

            return roomObject.fetch(url.toString(), request);
          } else {
            return new Response("User not authenticated.", { status: 404 });
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

    switch (request.method) {
      case "GET": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        };

        const pair = new WebSocketPair();
        await this.handleSession(pair[1], type, profileId);

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
    profileId: string,
  ): Promise<void> {
    const session: WebSocketSession = { type, profileId };
    (webSocket as any).serializeAttachment(session);
    this.state.acceptWebSocket(webSocket);
    this.sessions.set(webSocket, session);
  };

  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    const session = this.sessions.get(webSocket);

    this.sessions.delete(webSocket);
  };

  async webSocketError(webSocket: WebSocket, error: Error): Promise<void> {
    const session = this.sessions.get(webSocket);

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