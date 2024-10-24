import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Patient } from "../types";

export default async function patientRoutes(fastify: FastifyInstance) {
  // Create a new patient
  fastify.post(
    "/patients",
    async (request: FastifyRequest<{ Body: Patient }>, reply: FastifyReply) => {
      try {
        const patient = await fastify.services.patient.create(request.body);
        return reply.status(201).send(patient);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send(err);
      }
    },
  );

  // Get all patients
  fastify.get(
    "/patients",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const patients = await fastify.services.patient.findAll();
        return reply.send(patients);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send(err);
      }
    },
  );

  // Get a patient by ID
  fastify.get(
    "/patients/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const patient = await fastify.services.patient.findById(
          request.params.id,
        );
        return reply.send(patient);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(404).send(err);
      }
    },
  );

  // Update a patient
  fastify.put(
    "/patients/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: Partial<Patient>;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const patient = await fastify.services.patient.update({
          id: request.params.id,
          ...request.body,
        });
        return reply.send(patient);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send(err);
      }
    },
  );

  // Delete a patient
  fastify.delete(
    "/patients/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        await fastify.services.patient.delete(request.params.id);
        return reply.status(204).send();
      } catch (err) {
        fastify.log.error(err);
        return reply.status(404).send(err);
      }
    },
  );

  // Find a patient by Awell patient ID
  fastify.get(
    "/patients/awell/:awellPatientId",
    async (
      request: FastifyRequest<{ Params: { awellPatientId: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const patient = await fastify.services.patient.findByAwellPatientId(
          request.params.awellPatientId,
        );
        return reply.send(patient);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(404).send(err);
      }
    },
  );
}
