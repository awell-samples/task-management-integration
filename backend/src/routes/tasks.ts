import { FastifyInstance } from "fastify";
import { Client } from "pg";
import { CreateTaskSchema, Task } from "../types";
import TaskService from "../task-service";

export default async function (fastify: FastifyInstance) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  // Create a new task
  fastify.post<{ Body: Task }>(
    "/tasks",
    { schema: CreateTaskSchema },
    async (request, reply) => {
      const taskToCreate: Task = request.body;
      const taskService = new TaskService(client);
      const task = await taskService.create(taskToCreate);
      return reply.send(task);
    },
  );

  // Get all tasks
  fastify.get("/tasks", async (request, reply) => {
    const taskService = new TaskService(client);
    const rows = await taskService.findAll();
    return reply.send(rows);
  });

  // find a task by awell id
  fastify.get("/tasks/find", async (request, reply) => {
    const { activity_id } = request.query as { activity_id: string };
    const taskService = new TaskService(client);
    const task = await taskService.findByAwellActivityId(activity_id);
    return reply.send(task);
  });

  // Get a task by ID
  fastify.get<{ Params: { id: string } }>(
    "/tasks/:id",
    async (request, reply) => {
      const { id } = request.params;
      const taskService = new TaskService(client);
      const task = await taskService.findById(id);
      return reply.send(task);
    },
  );

  // Update a task
  fastify.put<{ Params: { id: string }; Body: Task }>(
    "/tasks/:id",
    async (request, reply) => {
      const taskId = Number(request.params.id);
      if (isNaN(taskId)) {
        return reply.code(400).send({ message: "Invalid task ID" });
      }
      const task: Task = request.body;
      const taskService = new TaskService(client);
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
      const taskService = new TaskService(client);
      await taskService.delete(taskId);
      return reply.send({ message: "Task deleted successfully", id: taskId });
    },
  );

  fastify.addHook("onClose", async () => {
    await client.end();
  });
}
