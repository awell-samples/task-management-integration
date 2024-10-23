import { FastifyInstance } from "fastify";
import { CreateTaskSchema, Task } from "../types";
import { FindAllOptions } from "../services/task-service";

interface FindTaskQueryParams {
  status?: string;
  patient_id?: string;
  populate?: string;
}

const deconstructFindTaskOptions = (
  options: FindTaskQueryParams,
): FindAllOptions => {
  const { status, patient_id, populate } = options;
  return {
    ...(status && { status: status.split(",") }),
    ...(patient_id && { patient_id }),
    ...(populate && { populate: populate === "true" }),
  };
};

export default async function (fastify: FastifyInstance) {
  // Create a new task
  fastify.post<{ Body: Task }>(
    "/tasks",
    { schema: CreateTaskSchema },
    async (request, reply) => {
      const taskToCreate: Task = request.body;
      const task = await fastify.services.task.create(taskToCreate);
      return reply.send(task);
    },
  );

  // Get all tasks
  fastify.get<{
    Querystring: FindTaskQueryParams;
  }>("/tasks", async (request, reply) => {
    const opts = deconstructFindTaskOptions(request.query);
    const rows = await fastify.services.task.findAll(opts);
    return reply.send(rows);
  });

  // find a task by awell id
  fastify.get<{ Querystring: { activity_id: string } & FindTaskQueryParams }>(
    "/tasks/find",
    async (request, reply) => {
      const { activity_id } = request.query;
      const task =
        await fastify.services.task.findByAwellActivityId(activity_id);
      return reply.send(task);
    },
  );

  fastify.get<{
    Querystring: FindTaskQueryParams;
  }>("/tasks/my", async (request, reply) => {
    const { id: user_id } = request.context.user;
    const opts = deconstructFindTaskOptions(request.query);
    const tasks = await fastify.services.task.findAll({ user_id, ...opts });
    return reply.send(tasks);
  });

  // Get a task by ID
  fastify.get<{ Params: { id: string } }>(
    "/tasks/:id",
    async (request, reply) => {
      const { id } = request.params;
      const task = await fastify.services.task.findById(id);
      return reply.send(task);
    },
  );

  // Update a task
  fastify.put<{ Params: { id: string }; Body: Task }>(
    "/tasks/:id",
    async (request, reply) => {
      const { id: taskId } = request.params;
      if (taskId === undefined) {
        return reply.code(400).send({ message: "Invalid task ID" });
      }
      const task: Task = request.body;
      const updatedTask = await fastify.services.task.update({
        ...task,
        id: taskId,
      });
      return reply.send({
        message: "Task updated successfully",
        task: updatedTask,
      });
    },
  );

  // Delete a task
  fastify.delete<{ Params: { id: string } }>(
    "/tasks/:id",
    async (request, reply) => {
      const { id: taskId } = request.params;
      if (taskId === undefined) {
        return reply.code(400).send({ message: "Invalid task ID" });
      }
      await fastify.services.task.delete(taskId);
      return reply.send({ message: "Task deleted successfully", id: taskId });
    },
  );
}
