import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (fastify, options) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  fastify.addHook("onClose", async () => {
    await fastify.prisma.$disconnect();
  });

  fastify.decorate("prisma", prisma);
});

export default prismaPlugin;
