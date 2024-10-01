import AuthService from "./auth-service";
import AwellService from "./awell-service";
import CommentService from "./comment-service";
import PatientService from "./patient-service";
import TaskService from "./task-service";
import UserService from "./user-service";

export * from "./auth-service";
export * from "./awell-service";
export * from "./comment-service";
export * from "./task-service";
export * from "./user-service";

export type Services = {
  auth: AuthService;
  awell: AwellService;
  comment: CommentService;
  patient: PatientService;
  task: TaskService;
  user: UserService;
};
