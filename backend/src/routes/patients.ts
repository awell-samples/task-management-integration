import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import PatientService from "../services/patient-service";
import { Patient } from "../types";

export default async function patientRoutes(fastify: FastifyInstance) {
  const patientService = new PatientService(fastify);

  // Create a new patient
  fastify.post(
    "/patients",
    async (request: FastifyRequest<{ Body: Patient }>, reply: FastifyReply) => {
      try {
        const patient = await patientService.create(request.body);
        return reply.status(201).send(patient);
      } catch (err) {
        return reply.status(400).send(err);
      }
    },
  );

  // Get all patients
  fastify.get(
    "/patients",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const patients = await patientService.findAll();
        return reply.send(patients);
      } catch (err) {
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
        const patient = await patientService.findById(request.params.id);
        return reply.send(patient);
      } catch (err) {
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
        const patient = await patientService.update({
          id: request.params.id,
          ...request.body,
        });
        return reply.send(patient);
      } catch (err) {
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
        await patientService.delete(request.params.id);
        return reply.status(204).send();
      } catch (err) {
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
        const patient = await patientService.findByAwellPatientId(
          request.params.awellPatientId,
        );
        return reply.send(patient);
      } catch (err) {
        return reply.status(404).send(err);
      }
    },
  );
}
