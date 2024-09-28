import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Prisma, PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const taskExtension = Prisma.defineExtension({
  name: "taskData",
  result: {
    task: {
      task_data: {
        // Deserialize when fetching data
        needs: { task_data: true },
        compute(task) {
          if (typeof task.task_data === "string") {
            return JSON.parse(task.task_data);
          } else {
            return task.task_data;
          }
        },
      },
    },
  },
  query: {
    task: {
      create({ args, query }) {
        // Serialize task_data when creating a new task
        if (args.data.task_data) {
          args.data.task_data = JSON.stringify(args.data.task_data);
        }
        return query(args);
      },
      update({ args, query }) {
        // Serialize task_data when updating an existing task
        if (args.data.task_data) {
          args.data.task_data = JSON.stringify(args.data.task_data);
        }
        return query(args);
      },
    },
  },
});

export function withTaskExtension(prisma: PrismaClient) {
  return prisma.$extends(taskExtension);
}
export type ExtendedPrismaClient = ReturnType<typeof withTaskExtension>;

const prismaPlugin: FastifyPluginAsync = fp(async (fastify, options) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  fastify.addHook("onClose", async () => {
    await fastify.prisma.$disconnect();
  });

  fastify.decorate("prisma", prisma);
});

export default prismaPlugin;
