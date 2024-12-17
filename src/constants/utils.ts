import { generateId } from "lucia";

export const ID = {
  generate: (props?: { len?: number }) => generateId(props?.["len"] ?? 21),
};

export enum Paths {
  Home = "/",
  Login = "/login",
  LoginGoogle = "/login/google",
  Register = "/register",
  VerifyEmail = "/verify-email",
  ResetPassword = "/reset-password",
  Dashboard = "/dashboard",
}
