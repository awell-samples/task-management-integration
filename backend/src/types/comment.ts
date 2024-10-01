import { BaseObject } from "./base";

export enum CommentStatus {
  Active = "active",
  Resolved = "resolved",
  Deleted = "deleted",
}

export interface Comment extends BaseObject {
  text: string;
  parent_id?: string;
  status: CommentStatus;
}
