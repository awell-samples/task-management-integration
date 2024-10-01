import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CreateTaskSchema, Task } from "../types";
import TaskService from "../services/task-service";

export default async function (fastify: FastifyInstance) {
  const taskService = new TaskService(fastify);

  // Create a new task
  fastify.post<{ Body: Task }>(
    "/tasks",
    { schema: CreateTaskSchema },
    async (request, reply) => {
      const taskToCreate: Task = request.body;
      const task = await taskService.createPrisma(taskToCreate);
      return reply.send(task);
    },
  );

  // Get all tasks
  fastify.get<{
    Querystring: {
      populate?: string;
      status?: string;
      patient_id?: string;
    };
  }>("/tasks", async (request, reply) => {
    const { status, populate, patient_id } = request.query;
    const rows = await taskService.findAllPrisma({
      ...(status && { status: status.split(",") }),
      ...(patient_id && { patient_id }),
      ...(populate && { populate: populate === "true" }),
    });
    return reply.send(rows);
  });

  // find a task by awell id
  fastify.get("/tasks/find", async (request, reply) => {
    const { activity_id } = request.query as { activity_id: string };
    const task = await taskService.findByAwellActivityId(activity_id);
    return reply.send(task);
  });

  // Get a task by ID
  fastify.get<{ Params: { id: string } }>(
    "/tasks/:id",
    async (request, reply) => {
      const { id } = request.params;
      const task = await taskService.findById(id);
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
      const updatedTask = await taskService.update({ ...task, id: taskId });
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
      await taskService.delete(taskId);
      return reply.send({ message: "Task deleted successfully", id: taskId });
    },
  );
}
