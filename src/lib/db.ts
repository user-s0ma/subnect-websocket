import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { connect } from "@tidbcloud/serverless";

interface Env {
  WEBSOCKET: DurableObjectNamespace;
  DATABASE_URL: string;
  WEBSOCKET_SECRET: string;
};

export function getPrismaClient(env: Env) {
  const connection = connect({ url: env.DATABASE_URL });
  const adapter = new PrismaTiDBCloud(connection);
  const prisma =  new PrismaClient({ adapter });
  return prisma;
}