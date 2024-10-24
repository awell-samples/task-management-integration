import { AwellSdk } from "@awell-health/awell-sdk";
import _ from "lodash";
import { Inject, Service } from "typedi";

@Service()
export default class AwellService {
  constructor(@Inject("awellSdk") private sdk: AwellSdk) {}

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
