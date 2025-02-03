import { generateId } from "lucia";

export const ID = {
  generate: (props?: { len?: number }) => generateId(props?.len ?? 21),
};

export enum Paths {
  Home = "/",

  Login = "/login",
  Register = "/register",
  TermsOfService = "/terms-of-service",
  PrivacyPolicy = "/privacy-policy",
  VerifyEmail = "/verify-email",
  ResetPassword = "/reset-password",

  Dashboard = "/dashboard",
  DashboardStores = "/dashboard/stores",
  DashboardSettings = "/dashboard/settings",
  DashboardSettingsAppearance = "/dashboard/settings/appearance",

  Store = "/s",
  StoreProduct = "/p",
  StoreCart = "/cart",

  StoreDashboard = "/ss",
  StoreDashboardProducts = "/products",
}
