import { FastifyInstance } from "fastify";
import { Task, TaskStatus } from "../types";
import TaskService from "../services/task-service";
import { Type, type Static } from "@sinclair/typebox";
import PatientService from "../services/patient-service";
import _ from "lodash";
import { BadRequestError, NotFoundError } from "../error";
import AwellService from "../services/awell-service";

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
  const taskService = new TaskService(fastify);
  const patientService = new PatientService(fastify);
  const awellService = new AwellService(fastify);

  fastify.post<{ Body: Static<typeof activityWebhookBody> }>(
    "/awell",
    { schema: activityWebhookSchema },
    async (request, reply) => {
      const { activity, pathway, event_type } = request.body;
      fastify.log.debug({
        msg: "Received awell webhook",
        activity,
        pathway,
        event_type,
      });

      // FIXME: Instead of managing a transaction, I'm making extra calls here. to ensure data integrity.
      const patient_id = await syncPatient(pathway.patient_id);

      if (activity.indirect_object?.type === "stakeholder") {
        if (event_type === "activity.created") {
          // create a task
          const task: Task = {
            title: activity.object.name,
            description: activity.object.type,
            task_type: "awell",
            patient_id,
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
          try {
            await taskService.create(task);
            fastify.log.debug({
              msg: "Task created from activity creation",
              activity,
              pathway,
            });
          } catch (err) {
            fastify.log.error({
              err,
              msg: "Error creating task",
              activity,
              pathway,
              event_type,
            });
          }
        } else if (event_type === "activity.completed") {
          // find the task and mark it as done
          try {
            const task = await taskService.findByAwellActivityId(activity.id);
            await taskService.updateStatus({
              id: task.id,
              status: TaskStatus.COMPLETED,
            });
            fastify.log.debug({
              msg: "Task completed from activity completion",
              activity,
              pathway,
            });
          } catch (err) {
            fastify.log.error({
              err,
              msg: "Error finding task using activity ID and updating",
              activity,
              pathway,
              event_type,
            });
          }
        }
      }
      reply.status(200).send({ message: "ok" });
    },
  );

  async function syncPatient(awellPatientId: string) {
    try {
      const resp = await patientService.findByAwellPatientId(awellPatientId);
      return resp.id;
    } catch (err) {
      if (err instanceof NotFoundError) {
        // create a new patient
        const profile = await awellService.getPatientProfile(awellPatientId);
        const resp = await patientService.create({
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          identifiers: [
            {
              system: "https://awellhealth.com",
              value: awellPatientId,
            },
          ],
        });
        return resp.id;
      } else if (
        err instanceof BadRequestError &&
        err.message.includes("duplicate key value violates unique constraint")
      ) {
        const resp = await patientService.findByAwellPatientId(awellPatientId);
        return resp.id;
      } else {
        throw err;
      }
    }
  }
}
