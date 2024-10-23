import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import * as stytch from "stytch";
import TaskService from "../services/task-service";
import UserService from "../services/user-service";
import PatientService from "../services/patient-service";
import AuthService from "../services/auth-service";
import AwellService from "../services/awell-service";
import CommentService from "../services/comment-service";
import Container from "typedi";
import { PrismaClient } from "@prisma/client";
import { getEnv } from "../environment";
import { isEmpty, isNil } from "lodash";
import { AwellSdk, Environment } from "@awell-health/awell-sdk";

export const servicesPlugin: FastifyPluginAsync = fp(
  async (fastify, options) => {
    if (isNil(fastify.config) || isEmpty(fastify.config)) {
      throw new Error("Fastify config is not set");
    }
    const prisma = new PrismaClient();
    fastify.addHook("onClose", async () => {
      await Container.get<PrismaClient>("prisma").$disconnect();
    });
    const logger = fastify.log;
    const stytchClient = new stytch.Client({
      project_id: getEnv("STYTCH_PROJECT_ID"),
      secret: getEnv("STYTCH_SECRET"),
    });
    const awellSdk = new AwellSdk({
      environment: fastify.config.AWELL_ENVIRONMENT as Environment,
      apiKey: fastify.config.AWELL_API_KEY,
    });
    Container.set("prisma", prisma);
    Container.set("logger", logger);
    Container.set("stytch", stytchClient);
    Container.set("awellSdk", awellSdk);
    Container.set(TaskService, new TaskService(prisma, logger));
    Container.set(AuthService, new AuthService(stytchClient));
    Container.set(UserService, new UserService(prisma, logger));
    Container.set(CommentService, new CommentService(prisma, logger));
    Container.set(AwellService, new AwellService(awellSdk));
    Container.set(PatientService, new PatientService(prisma, logger));
    const services = {
      auth: Container.get(AuthService),
      awell: Container.get(AwellService),
      comment: Container.get(CommentService),
      patient: Container.get(PatientService),
      task: Container.get(TaskService),
      user: Container.get(UserService),
    };
    fastify.decorate("services", services);
  },
);
