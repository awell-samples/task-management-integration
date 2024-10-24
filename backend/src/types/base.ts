export interface BaseObject {
  id: string;
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
  created_by_user_id: string;
  updated_by_user_id?: string;
  deleted_by_user_id?: string;
}

export type Ephemeral<T> = Omit<
  T,
  "id" | "created_at" | "created_by_user_id"
> & {
  id?: string;
  created_at?: Date;
  created_by_user_id?: string;
};
