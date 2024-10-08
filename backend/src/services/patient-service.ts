import { BadRequestError, NotFoundError } from "../error";
import { type Patient, type Identifier, Valid } from "../types";
import _ from "lodash";
import { FastifyInstance } from "fastify";

export default class PatientService {
  private _pg: FastifyInstance["pg"];
  private logger: FastifyInstance["log"];

  constructor(fastify: FastifyInstance) {
    this._pg = fastify.pg;
    this.logger = fastify.log;
  }

  async create(patient: Patient) {
    try {
      await this._pg.query("BEGIN");

      const { rows } = await this._pg.query(
        `INSERT INTO patients (id, first_name, last_name, created_at, updated_at) 
        VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW()) 
        RETURNING *`,
        [patient.first_name, patient.last_name],
      );
      this.logger.debug({ msg: "Created patient", data: { patient: rows[0] } });

      const createdPatient = rows[0];
      await this.insertIdentifiers(createdPatient.id, patient.identifiers);
      this.logger.debug({
        msg: "Inserted identifiers",
        data: {
          identifiers: patient.identifiers,
        },
      });
      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
      return this.maybeWithIdentifiers(createdPatient);
    } catch (err) {
      await this._pg.query("ROLLBACK");
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { patient }, error.stack);
    }
  }

  async findAll() {
    const { rows } = await this._pg.query(
      `SELECT p.*, 
              json_agg(json_build_object('system', pi.system, 'value', pi.value)) AS identifiers
       FROM patients p
       LEFT JOIN patients_identifiers pi ON p.id = pi.patient_id
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
    );
    this.logger.debug({
      msg: "Returning patients",
      data: { count: rows.length },
    });
    return rows.map(this.maybeWithIdentifiers);
  }

  async findById(id: string) {
    const { rows } = await this._pg.query(
      `SELECT p.*, 
              json_agg(json_build_object('system', pi.system, 'value', pi.value)) AS identifiers
       FROM patients p
       LEFT JOIN patients_identifiers pi ON p.id = pi.patient_id
       WHERE p.id = $1
       GROUP BY p.id
       LIMIT 1`,
      [id],
    );
    this.logger.debug({ msg: "Found patient", data: { id } });
    if (rows.length === 0) {
      throw new NotFoundError("Patient not found", { id });
    }

    return this.maybeWithIdentifiers(rows[0]);
  }

  async update(patient: Partial<Patient>) {
    const currentPatient = await this.findById(patient.id!);
    if (!currentPatient) {
      throw new NotFoundError("Patient not found", { id: patient.id });
    }

    try {
      await this._pg.query("BEGIN");

      const mergedPatient = { ...currentPatient, ...patient };
      const { rows } = await this._pg.query(
        `UPDATE patients SET 
          first_name = $1, last_name = $2, updated_at = NOW() 
          WHERE id = $3 RETURNING *`,
        [mergedPatient.first_name, mergedPatient.last_name, mergedPatient.id],
      );
      this.logger.debug({ msg: "Updated patient", data: { patient: rows[0] } });

      await this.updateIdentifiers(mergedPatient.id!, patient.identifiers);
      this.logger.debug({
        msg: "Updated identifiers",
        data: {
          identifiers: patient.identifiers,
        },
      });
      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
      const updatedPatient = this.maybeWithIdentifiers(rows[0]);
      return { ...updatedPatient, identifiers: mergedPatient.identifiers };
    } catch (err) {
      await this._pg.query("ROLLBACK");
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { patient }, error.stack);
    }
  }

  async delete(id: string) {
    try {
      await this._pg.query("BEGIN");

      await this._pg.query(
        "DELETE FROM patients_identifiers WHERE patient_id = $1",
        [id],
      );
      this.logger.debug({
        msg: "Deleted identifiers",
        data: { patient_id: id },
      });
      const { rowCount } = await this._pg.query(
        "DELETE FROM patients WHERE id = $1",
        [id],
      );
      this.logger.debug({ msg: "Deleted patient", data: { id } });
      if (rowCount === 0) {
        throw new NotFoundError("Patient not found", { id });
      }

      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      throw err;
    }
  }

  async findByAwellPatientId(patientId: string): Promise<Valid<Patient>> {
    const { rows } = await this._pg.query(
      `SELECT p.*, 
              json_agg(json_build_object('system', pi.system, 'value', pi.value)) AS identifiers
       FROM patients p
       JOIN patients_identifiers pi ON p.id = pi.patient_id
       WHERE pi.system = $1 AND pi.value = $2
       GROUP BY p.id
       LIMIT 1`,
      ["https://awellhealth.com", patientId],
    );

    if (rows.length === 0) {
      throw new NotFoundError("Patient not found", { patient_id: patientId });
    }

    return this.maybeWithIdentifiers(rows[0]);
  }

  private async insertIdentifiers(
    patientId: string,
    identifiers: Identifier[],
  ) {
    for (const identifier of identifiers) {
      await this._pg.query(
        `INSERT INTO patients_identifiers (patient_id, system, value) VALUES ($1, $2, $3)`,
        [patientId, identifier.system, identifier.value],
      );
    }
  }

  private async updateIdentifiers(
    patientId: string,
    identifiers: Identifier[] = [],
  ) {
    const { rows: currentIdentifiers } = await this._pg.query(
      "SELECT system, value FROM patients_identifiers WHERE patient_id = $1",
      [patientId],
    );

    const identifiersToDelete = currentIdentifiers.filter(
      (current) =>
        !identifiers.some(
          (identifier) =>
            identifier.system === current.system &&
            identifier.value === current.value,
        ),
    );

    const identifiersToAdd = identifiers.filter(
      (identifier) =>
        !currentIdentifiers.some(
          (current) =>
            identifier.system === current.system &&
            identifier.value === current.value,
        ),
    );

    // Delete identifiers that are not in the updated list
    for (const identifier of identifiersToDelete) {
      await this._pg.query(
        "DELETE FROM patients_identifiers WHERE patient_id = $1 AND system = $2 AND value = $3",
        [patientId, identifier.system, identifier.value],
      );
    }

    // Insert new identifiers
    await this.insertIdentifiers(patientId, identifiersToAdd);
  }

  private maybeWithIdentifiers(patient: Valid<Patient>) {
    return {
      ...patient,
      ...(patient.identifiers && {
        identifiers: patient.identifiers.filter(
          (i: Identifier) => !_.isNil(i.system) && !_.isNil(i.value),
        ),
      }),
    };
  }
}
