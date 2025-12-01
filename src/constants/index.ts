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
  DashboardOrders = "/dashboard/orders",
  DashboardStores = "/dashboard/stores",
  DashboardCreateStore = "/dashboard/create-store",
  DashboardSettings = "/dashboard/settings",
  DashboardSettingsAppearance = "/dashboard/settings/appearance",

  // (dashboard/stores)
  DashboardStore = "/dashboard/ss",
  DashboardStoreProducts = "/products", // starts w {id}/products
  DashboardStoreOrders = "/orders", // starts w {id}/orders

  // (stores)
  Store = "/ss",
  StoreProduct = "/p",
  StoreCart = "/cart",
  StoreCheckout = "/checkout",
  StoreCheckoutShipping = "/checkout/shipping",
  StoreCheckoutPayment = "/checkout/payment",
  StoreCheckoutReview = "/checkout/review",
}
