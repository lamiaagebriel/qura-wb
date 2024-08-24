import { NavItem, SelectItem } from "@/types";

export default {
  site: {
    name: "concom",
    description:
      "Our platform offers advanced social media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
  },
  auth: {
    login: {
      meta: { title: "Login" },
      "welcome back!": "Welcome Back!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "Join our community and unlock amazing features to streamline your work and boost your productivity.",
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "Alex Thompson, CEO of Thompson Real Estate",
      "don't have an account? sign up now":
        "Don't have an account? Sign Up now",
      "or continue with": "or continue with",
      "sign in with email": "Sign In with Email",
      "sign in with google": "Sign In with Google",
      "forgot password": "Forgot Password?",
    },
    register: {
      meta: { title: "Register" },
      "create an account!": "Create an account!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "Join our community and unlock amazing features to streamline your work and boost your productivity.",
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "Alex Thompson, CEO of Thompson Real Estate",
      "already have an account? sign in.": "Already have an account? Sign In.",
      "or continue with": "or continue with",
      "sign up with email": "Sign Up with Email",
      "sign up with google": "Sign Up with Google",
    },
  },
  dashboard: {
    user: {
      meta: { title: "Dashboard" },
      "main-nav": {
        top: [
          [
            {
              segment: null,
              value: "/dashboard",
              label: "Dashboard",
              icon: "grid",
              indicator: 10,
            },
            {
              segment: "stores",
              value: "/dashboard/stores",
              label: "Stores",
              icon: "store",
              indicator: 10,
            },
          ],
        ],
      } as { top?: NavItem[][]; bottom?: NavItem[][] },
      dashboard: "Dashboard",
      stores: {
        meta: { title: "Stores" },
        stores: "Stores",
      },
    },
  },

  "data-table-column-header": {
    asc: "Asc",
    desc: "Desc",
    hide: "Hide",
  },
  "data-table-pagination": {
    of: "of",
    "row(s) selected.": "row(s) selected.",
    "rows per page": "rows per page",
    "go to first page": "Go to first page",
    "go to previous page": "Go to previous page",
    "go to next page": "Go to next page",
    "go to last page": "Go to last page",
    page: "page",
  },
  "data-table-view-options": {
    view: "View",
    "toggle columns": "Toggle columns",
  },
  "data-table": {
    "no results.": "No Results.",
  },
  "locale-switcher": {
    "current locale of the website": "current locale of the website",
    en: "English (EN)",
    ar: "العربية (AR)",
    fr: "French (FR)",
    de: "Deautch (DE)",
  },
  "mode-toggle": {
    "toggle theme": "toggle theme",
    modes: [
      { value: "light", label: "Light", icon: "sun" },
      { value: "dark", label: "Dark", icon: "moon" },
      { value: "system", label: "System", icon: "laptop" },
    ] as SelectItem[],
  },
  "resizeable-layout": { logout: "Logout" },
  "responsive-dialog": {
    "are you sure you want to proceed?": "Are you sure you want to proceed?",
    "please confirm that all the provided information is accurate. This action cannot be undone.":
      "Please confirm that all the provided information is accurate. This action cannot be undone.",
    cancel: "Cancel",
  },
  "store-bin-button": {
    "deleted successfully.": "deleted successfully.",
    delete: "Delete",
    "delete store": "Delete Store",
    "once deleted, the store will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if restored, everything will be reinstated as if nothing happened.":
      "Once deleted, the store will be moved to the bin. You can manually delete it or it will be automatically removed after 30 days. If restored, everything will be reinstated as if nothing happened.",
  },
  "store-create-button": {
    "created successfully.": "created successfully.",
    submit: "Submit",
    "create store": "Create Store",
    "by providing detailed information about your store, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.":
      "By providing detailed information about your store, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.",
  },
  "store-delete-button": {
    "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.":
      "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.",
    "deleted successfully.": "deleted successfully.",
    delete: "Delete",
    "delete store": "Delete Store",
  },
  "store-restore-button": {
    "restoring this store will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off.":
      "Restoring this store will bring back all its data and settings, making it appear as if it was never deleted. All related information will be fully reinstated, allowing you to pick up right where you left off.",
    "restored successfully.": "restored successfully.",
    restore: "Restore",
    "restore store": "Restore Store",
  },
  "store-form": {
    name: {
      name: "Name",
      "health center": "Health Center",
    },
  },
  "store-update-button": {
    "updated successfully.": "updated successfully.",
    submit: "Submit",
    "update store": "Update Store",
    "updating a store allows you to refine and enhance the details of your ongoing developments":
      "Updating a store allows you to refine and enhance the details of your ongoing developments",
  },
  "stores-table": {
    name: "Name",
    edit: "Edit",
    delete: "Delete",
  },
  "user-form": {
    name: {
      "full name": "Full Name",
      "joe doe": "Joe Doe",
    },
    email: { email: "Email" },
    password: { password: "Password" },
  },
};
