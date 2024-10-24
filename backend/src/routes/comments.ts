import { FastifyInstance } from "fastify";
import { Comment, Ephemeral } from "../types";

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: Comment; Params: { taskId: string } }>(
    "/tasks/:taskId/comments",
    async (request, reply) => {
      const commentToCreate: Ephemeral<Comment> = {
        ...request.body,
        created_by_user_id: request.context.user.id,
      };
      request.log.info({
        message: "creating comment",
        comment: commentToCreate,
      });
      const taskId = request.params.taskId;
      const comment = await fastify.services.comment.create(
        taskId,
        commentToCreate,
      );
      return reply.send(comment);
    },
  );

  fastify.get<{ Params: { taskId: string } }>(
    "/tasks/:taskId/comments",
    async (request, reply) => {
      console.log("GET /tasks/:taskId/comments");
      const taskId = request.params.taskId;
      const comments = await fastify.services.comment.findByTaskId(taskId);
      return reply.send(comments);
    },
  );
}
