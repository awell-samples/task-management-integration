import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import TaskService from "../services/task-service";
import UserService from "../services/user-service";
import PatientService from "../services/patient-service";
import AuthService from "../services/auth-service";
import AwellService from "../services/awell-service";
import CommentService from "../services/comment-service";

export const servicesPlugin: FastifyPluginAsync = fp(
  async (fastify, options) => {
    const services = {
      auth: new AuthService(fastify),
      awell: new AwellService(fastify),
      comment: new CommentService(fastify),
      patient: new PatientService(fastify),
      task: new TaskService(fastify),
      user: new UserService(fastify),
    };
    fastify.decorate("services", services);
  },
);
