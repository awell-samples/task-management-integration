import { NotFoundError } from "../error";
import { type Patient } from "../types";
import _, { isNil } from "lodash";
import { FastifyBaseLogger } from "fastify";
import { Inject, Service } from "typedi";
import { PrismaClient } from "@prisma/client";

@Service()
export default class PatientService {
  constructor(
    @Inject("prisma") private prisma: PrismaClient,
    @Inject("logger") private logger: FastifyBaseLogger,
  ) {}

  async create(patient: Patient) {
    const createdPatient = await this.prisma.patient.create({
      data: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        created_at: new Date(),
        updated_at: new Date(),
        patient_identifiers: {
          createMany: {
            data: patient.identifiers.map((i) => ({
              system: i.system,
              value: i.value,
            })),
          },
        },
      },
      include: {
        patient_identifiers: true,
      },
    });
    this.logger.debug({
      msg: "Created patient",
      data: { patient: createdPatient },
    });
    return createdPatient;
  }

  async findAll() {
    const patients = await this.prisma.patient.findMany({
      include: {
        patient_identifiers: true,
      },
    });
    this.logger.debug({
      msg: "Returning patients",
      data: { count: patients.length },
    });
    return patients;
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        id,
      },
      include: {
        patient_identifiers: true,
      },
    });
    if (!patient) {
      throw new NotFoundError("Patient not found", { id });
    }
    this.logger.debug({ msg: "Found patient", data: { id } });
    return patient;
  }

  async update(patient: Partial<Patient>) {
    const updatedPatient = await this.prisma.patient.update({
      where: {
        id: patient.id,
      },
      data: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        updated_at: new Date(),
        patient_identifiers: {
          deleteMany: {},
          createMany: {
            data: (patient.identifiers ?? []).map((i) => ({
              system: i.system,
              value: i.value,
            })),
          },
        },
      },
      include: {
        patient_identifiers: true,
      },
    });
    this.logger.debug({
      msg: "Updated patient",
      data: { patient: updatedPatient },
    });
    return updatedPatient;
  }

  async delete(id: string) {
    await this.prisma.patient.delete({
      where: {
        id,
      },
    });
    this.logger.debug({ msg: "Deleted patient", data: { id } });
  }

  async findByAwellPatientId(patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        patient_identifiers: {
          some: {
            system: "https://awellhealth.com/patient",
            value: patientId,
          },
        },
      },
      include: {
        patient_identifiers: true,
      },
    });
    if (isNil(patient)) {
      throw new NotFoundError("Patient not found", { patient_id: patientId });
    }
    this.logger.debug({
      msg: "Found patient by awell patient id",
      data: { patient_id: patientId },
    });
    return patient;
  }
}
