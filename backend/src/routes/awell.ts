import { FastifyInstance } from "fastify";
import { Task, TaskStatus } from "../types";
import TaskService from "../task-service";
import { Client } from "pg";
import { Type, type Static } from "@sinclair/typebox";

const activityWebhookBody = Type.Object({
  activity: Type.Object({
    id: Type.String(),
    stream_id: Type.String(),
    subject: Type.Optional(
      Type.Object({
        name: Type.String(),
        type: Type.String(),
      }),
    ),
    object: Type.Object({
      id: Type.String(),
      name: Type.String(),
      type: Type.String(),
    }),
    indirect_object: Type.Optional(
      Type.Object({
        id: Type.String(),
        name: Type.String(),
        type: Type.String(),
      }),
    ),
    date: Type.String({ format: "date-time" }),
    context: Type.Object({
      instance_id: Type.Optional(Type.String()),
      action_id: Type.Optional(Type.String()),
      step_id: Type.Optional(Type.String()),
      track_id: Type.Optional(Type.String()),
      pathway_id: Type.String(),
    }),
    action: Type.String(),
    resolution: Type.Optional(Type.String()),
    sub_activities: Type.Optional(Type.Array(Type.Any())),
  }),
  pathway: Type.Object({
    id: Type.String(),
    patient_id: Type.String(),
    pathway_definition_id: Type.String(),
    tenant_id: Type.String(),
    start_date: Type.String({ format: "date-time" }),
  }),
  event_type: Type.String({
    enum: ["activity.created", "activity.completed", "activity.failed"],
  }),
});

const activityWebhookSchema = {
  body: activityWebhookBody,
};

export default async function (fastify: FastifyInstance) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  fastify.post<{ Body: Static<typeof activityWebhookBody> }>(
    "/awell",
    { schema: activityWebhookSchema },
    async (request, reply) => {
      // receive the webhook from awell, identify the type of activity, handle accordingly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { activity, pathway, event_type } = request.body;
      // fastify.log.info({ body: request.body });
      const taskService = new TaskService(client);
      if (activity.indirect_object?.type === "stakeholder") {
        if (event_type === "activity.created") {
          // create a task
          const task: Task = {
            title: activity.object.name,
            description: activity.object.type,
            task_type: "awell",
            task_data: {
              activity,
              pathway,
            },
            identifiers: [
              {
                system: "https://awellhealth.com",
                value: activity.id,
              },
            ],
            status: TaskStatus.PENDING,
          };
          await taskService.create(task);
        } else if (event_type === "activity.completed") {
          // find the task and mark it as done
          const task = await taskService.findByAwellActivityId(activity.id);
          await taskService.update({
            id: task.id,
            status: TaskStatus.COMPLETED,
          });
        }
      }
      reply.status(200).send({ message: "ok" });
    },
  );
  fastify.addHook("onClose", async () => {
    await client.end();
  });
}
