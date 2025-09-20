export enum Paths {
  Home = "/",
  TermsOfService = "/terms-of-service",
  PrivacyPolicy = "/privacy-policy",

  // (auth)
  Login = "/login",
  Register = "/register",
  ResetPassword = "/reset-password",
  VerifyEmail = "/verify-email",
  // (dashboard)
  Dashboard = "/dashboard",
  DashboardStores = "/dashboard/stores",
  DashboardSettings = "/dashboard/settings",
  DashboardSettingsAppearance = "/dashboard/settings/appearance",

  // (dashboard/stores)
  DashboardStore = "/dashboard/ss",
  DashboardStoreProducts = "/products", // starts w {id}/products

  // (stores)
  Store = "/ss",
  StoreProduct = "/p",
  StoreCart = "/cart",
}
