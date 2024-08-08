import { Identifier } from "./identifier";
export type Patient = {
  id?: string;
  first_name: string;
  last_name: string;
  identifiers: Identifier[];
  created_at?: Date;
  updated_at?: Date;
};
