import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { connect } from "@tidbcloud/serverless";

export function getPrismaClient() {
  const connection = connect({ url: process.env.DATABASE_URL });
  const adapter = new PrismaTiDBCloud(connection);
  const prisma =  new PrismaClient({ adapter });
  return prisma;
}