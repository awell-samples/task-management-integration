import { FastifyInstance } from "fastify";
import UserService from "../services/user-service";
import { User } from "../types";
import _ from "lodash";

export default async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService(fastify);

  // Create a new user
  fastify.post<{ Body: User }>("/users", async (request, reply) => {
    const user = await userService.create(request.body);
    reply.status(201).send(user);
  });

  // Get all users
  fastify.get<{ Querystring: { email?: string } }>(
    "/users",
    async (request, reply) => {
      if (request.query?.email) {
        const user = await userService.findByEmail(request.query.email);
        return reply.send(user);
      } else {
        const users = await userService.findAll();
        reply.send(users);
      }
    }
  );

  // Get all users
  fastify.get<{ Querystring: { email: string } }>(
    "/users/find",
    async (request, reply) => {
      const user = await userService.findByEmail(request.query.email);
      return reply.send(user);
    }
  );

  fastify.get<{ Querystring: { domain?: string } }>(
    "/users/search",
    async (request, reply) => {
      switch (true) {
        case !_.isNil(request.query.domain): {
          const user = await userService.getUsersByEmailDomain(
            request.query.domain
          );
          return reply.send(user);
        }
        default: {
          throw new Error("Invalid query params. Please search by domain");
        }
      }
    }
  );

  // Get a user by ID
  fastify.get<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      const user = await userService.findById(request.params.id);
      reply.send(user);
    }
  );

  // Update a user by ID
  fastify.put<{ Params: { id: string }; Body: Partial<User> }>(
    "/users/:id",
    async (request, reply) => {
      const user = await userService.update({
        id: request.params.id,
        ...request.body,
      });
      reply.send(user);
    }
  );

  // Delete a user by ID
  fastify.delete<{ Params: { id: string } }>(
    "/users/:id",
    async (request, reply) => {
      await userService.delete(request.params.id);
      reply.status(204).send();
    }
  );
}
