import { AwellSdk, type Environment } from "@awell-health/awell-sdk";
import { FastifyInstance } from "fastify";
import _ from "lodash";

export default class AwellService {
  sdk: AwellSdk;
  constructor(fastify: FastifyInstance) {
    this.sdk = new AwellSdk({
      environment: fastify.config.AWELL_ENVIRONMENT as Environment,
      apiKey: fastify.config.AWELL_API_KEY,
    });
  }

  async getPatientProfile(patientId: string) {
    const resp = await this.sdk.orchestration.query({
      patient: {
        success: true,
        patient: {
          id: true,
          profile: {
            first_name: true,
            last_name: true,
            mobile_phone: true,
          },
        },
        __args: {
          id: patientId,
        },
      },
    });
    if (!resp.patient.success || _.isNil(resp.patient?.patient?.profile)) {
      throw new Error("Failed to get patient profile");
    }
    return resp.patient.patient.profile;
  }
}
