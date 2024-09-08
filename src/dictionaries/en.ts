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
              segment: ["stores", "(shortcuts)"],
              value: "/dashboard/stores",
              label: "Stores",
              icon: "store",
              indicator: 10,
            },
          ],
          [
            {
              segment: ["bin"],
              value: "/dashboard/bin",
              label: "Bin",
              icon: "trash",
            },
          ],
        ],
      } as { top?: NavItem[][]; bottom?: NavItem[][] },
      dashboard: "Dashboard",
      bin: {
        meta: { title: "Bin - Stores" },
        "main-nav": [
          { segment: null, value: "/dashboard/bin", label: "Stores" },
          {
            segment: ["products"],
            value: "/dashboard/bin/products",
            label: "Products",
          },
          {
            segment: ["orders"],
            value: "/dashboard/bin/orders",
            label: "Orders",
          },
        ] as NavItem[],
        bin: "Bin",
        "below is a list of your deleted items. you can restore them within 30 days before they are permanently removed.":
          "Below is a list of your deleted items. You can restore them within 30 days before they are permanently removed.",
      },
      stores: {
        meta: { title: "Stores" },
        stores: "Stores",
        "back to all stores": "back to all stores",
        "warning!": "Warning!",
        "this store is deleted, once you restore it all will be editable.":
          "This store is deleted, once you restore it all will be editable.",
        orders: {
          order: {
            "warning!": "warning!",
            "its store is deleted, once you restore it all will be editable.":
              "Its store is deleted, once you restore it all will be editable.",

            "this order is deleted, once you restore it all will be editable.":
              "This order is deleted, once you restore it all will be editable.",
          },
        },
        products: {
          product: {
            "warning!": "warning!",
            "its store is deleted, once you restore it all will be editable.":
              "Its store is deleted, once you restore it all will be editable.",

            "this product is deleted, once you restore it all will be editable.":
              "This product is deleted, once you restore it all will be editable.",
          },
        },
      },
    },
  },
  "bin-orders-table": {
    name: "Name",
    delete: "Delete",
    restore: "Restore",
    deletedAt: "Deleted At",
  },
  "bin-products-table": {
    name: "Name",
    delete: "Delete",
    restore: "Restore",
    deletedAt: "Deleted At",
  },
  "bin-stores-table": {
    name: "Name",
    delete: "Delete",
    restore: "Restore",
    deletedAt: "Deleted At",
  },

  "dashboard-posts-bar-chart": {
    posts: "Posts",
    "showing total posts for the last 3 months.":
      "Showing total posts for the last 3 months.",
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    twitter: "Twitter",
    views: "Views",
  },

  "data-table-column-header": {
    asc: "Asc",
    desc: "Desc",
    hide: "Hide",
  },
  "data-table-faceted-filter": {
    selected: "selected",
    "no results found.": "No results found.",
    "clear filters": "Clear filters",
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
  "data-table-row-actions": {
    "open menu": "Open menu",
    actions: "Actions",
  },
  "data-table-toolbar": {
    reset: "Reset",
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
    "moved to bin.": "moved to bin.",
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
    edit: "Edit",
    "update store": "Update Store",
    "updating a store allows you to refine and enhance the details of your ongoing developments":
      "Updating a store allows you to refine and enhance the details of your ongoing developments",
  },
  "stores-table": {
    name: "Name",
    edit: "Edit",
    delete: "Delete",
  },

  "order-bin-button": {
    "moved to bin.": "moved to bin.",
    delete: "Delete",
    "delete order": "Delete Order",
    "once deleted, the order will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if reorderd, everything will be reinstated as if nothing happened.":
      "Once deleted, the order will be moved to the bin. You can manually delete it or it will be automatically removed after 30 days. If reorderd, everything will be reinstated as if nothing happened.",
  },
  "order-create-button": {
    "created successfully.": "created successfully.",
    submit: "Submit",
    "create order": "Create Order",
    "by providing detailed information about your order, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.":
      "By providing detailed information about your order, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.",
  },
  "order-delete-button": {
    "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.":
      "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.",
    "deleted successfully.": "deleted successfully.",
    delete: "Delete",
    "delete order": "Delete Order",
  },
  "order-restore-button": {
    "restoring this order will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off.":
      "Restoring this order will bring back all its data and settings, making it appear as if it was never deleted. All related information will be fully reinstated, allowing you to pick up right where you left off.",
    "restored successfully.": "restored successfully.",
    restore: "Restore",
    "restore order": "Restore Order",
  },
  "order-form": {
    size: {
      size: "Size",
      xl: "XL",
    },
  },
  "order-update-button": {
    "updated successfully.": "updated successfully.",
    submit: "Submit",
    edit: "Edit",
    "update order": "Update Order",
    "updating a order allows you to refine and enhance the details of your ongoing developments":
      "Updating a order allows you to refine and enhance the details of your ongoing developments",
  },
  "orders-table": {
    name: "Name",
    edit: "Edit",
    delete: "Delete",
  },

  "product-bin-button": {
    "moved to bin.": "moved to bin.",
    delete: "Delete",
    "delete product": "Delete Product",
    "once deleted, the product will be moved to the bin. you can manually delete it or it will be automatically removed after 30 days. if reproductd, everything will be reinstated as if nothing happened.":
      "Once deleted, the product will be moved to the bin. You can manually delete it or it will be automatically removed after 30 days. If reproductd, everything will be reinstated as if nothing happened.",
  },
  "product-create-button": {
    "created successfully.": "created successfully.",
    submit: "Submit",
    "create product": "Create Product",
    "by providing detailed information about your product, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.":
      "By providing detailed information about your product, you'll be able to streamline your operations, track progress, and ensure that all stakeholders are informed about the development's key aspects and milestones.",
  },
  "product-delete-button": {
    "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.":
      "once deleted, this action cannot be undone. please be certain, as all relevant data will be permanently deleted.",
    "deleted successfully.": "deleted successfully.",
    delete: "Delete",
    "delete product": "Delete Product",
  },
  "product-restore-button": {
    "restoring this product will bring back all its data and settings, making it appear as if it was never deleted. all related information will be fully reinstated, allowing you to pick up right where you left off.":
      "Restoring this product will bring back all its data and settings, making it appear as if it was never deleted. All related information will be fully reinstated, allowing you to pick up right where you left off.",
    "restored successfully.": "restored successfully.",
    restore: "Restore",
    "restore product": "Restore Product",
  },
  "product-form": {
    name: {
      name: "Name",
      "health center": "Health Center",
    },
  },
  "product-update-button": {
    "updated successfully.": "updated successfully.",
    submit: "Submit",
    edit: "Edit",
    "update product": "Update Product",
    "updating a product allows you to refine and enhance the details of your ongoing developments":
      "Updating a product allows you to refine and enhance the details of your ongoing developments",
  },
  "products-table": {
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
