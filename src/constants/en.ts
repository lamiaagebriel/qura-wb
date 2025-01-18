import { NavItem, SelectItem } from "@/types";

import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@/lib/validations";

import { Paths } from "./utils";

const en = {
  site: {
    name: "ConCom",
    description:
      "Our platform offers advanced sociasl media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
  },
  auth: {
    login: {
      "back home": "Back Home",
      "welcome back!": "Welcome back!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "Join our community and unlock amazing features to streamline your work and boost your productivity.",
      "don't have an account? sign up now":
        "Don't have an account? Sign Up now",
      "or continue with": "or continue with",
      "sign in with email": "Sign In with Email",
      "sign in with google": "Sign In with Google",
      "forgot password": "Forgot Password?",
    },
    register: {
      login: "Login",
      "create an account!": "Create an account!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "Join our community and unlock amazing features to streamline your work and boost your productivity.",
      "by clicking continue, you agree to our":
        "By clicking continue, you agree to our",
      "terms of service": "Terms of Service",
      and: "and",
      "privacy policy": "Privacy Policy",
      "or continue with": "or continue with",
      "sign up with email": "Sign Up with Email",
      "sign up with google": "Sign Up with Google",
    },
    "forgot-password": {
      login: "Login",
      "forgot password?": "Forgot Password?",
      "password reset link will be sent to your email.":
        "Password reset link will be sent to your email.",
      "don't have an account? sign up now":
        "Don't have an account? Sign Up now",
    },
    "reset-password": {
      "back home": "Back Home",
      "reset password": "Reset Password",
      "enter a new strong password twice.":
        "Enter a new strong password twice.",
      "remember password? login now": "remember password? login now",
    },
    "verify-email": {
      "verify email": "Verify Email",
      "verification code was sent to": "Verification code was sent to",
      "check your spam folder if you can't find the email.":
        "check your spam folder if you can't find the email.",
      "want to use another email? logout now.":
        "want to use another email? Logout now.",
    },
  },

  dashboard: {
    "main-nav": [
      {
        segments: [null],
        value: Paths.Dashboard,
        children: "Overview",
        icon: "dashboard",
      },
      {
        segments: ["stores"],
        value: Paths.DashboardStores,
        children: "Stores",
        icon: "store",
      },
    ] as NavItem[],
    "user-nav": [
      {
        segments: ["settings"],
        value: Paths.DashboardSettings,
        children: "Settings",
        icon: "settings",
      },
    ] as NavItem[],

    overview: {
      overview: "Overview",
      "browse all overview, edit, and filter.":
        "Browse all overview, edit, and filter.",
    },
    stores: {
      stores: "Stores",
      "browse all stores, edit, and filter.":
        "Browse all stores, edit, and filter.",
    },
  },
  stores: {
    store: {
      "main-nav": [
        {
          segments: [null],
          value: "/",
          children: "Overview",
          icon: "dashboard",
        },
        {
          segments: ["products"],
          value: "/products",
          children: "Products",
          icon: "shirt",
        },
        {
          segments: ["orders"],
          value: "/orders",
          children: "Orders",
          icon: "packagePlus",
        },
        {
          segments: ["customers"],
          value: "/customers",
          children: "Customers",
          icon: "users",
        },
        {
          segments: ["reviews"],
          value: "/reviews",
          children: "Reviews",
          icon: "stars",
        },
        {
          segments: ["promotions"],
          value: "/promotions",
          children: "Promotions",
          icon: "percent",
        },
        {
          segments: ["pages"],
          value: "/pages",
          children: "Pages",
          icon: "files",
        },
      ] as NavItem[],
      "user-nav": [
        {
          segments: ["settings"],
          value: "/settings",
          children: "Settings",
          icon: "settings",
        },
      ] as NavItem[],

      overview: "Overview",
      "browse all overview, edit, and filter.":
        "Browse all overview, edit, and filter.",

      products: {
        products: "Products",
        "browse all products, edit, and filter.":
          "Browse all products, edit, and filter.",
      },
      orders: {
        orders: "Orders",
        "browse all orders, edit, and filter.":
          "Browse all orders, edit, and filter.",
      },
      customers: {
        customers: "Customers",
        "browse all customers, preview, and filter.":
          "Browse all customers, preview, and filter.",
      },
      reviews: {
        reviews: "Reviews",
        "browse all reviews, edit, and filter.":
          "Browse all reviews, edit, and filter.",
      },

      promotions: {
        promotions: "Promotions",
        "browse all promotions, preview, and filter.":
          "Browse all promotions, preview, and filter.",
      },

      pages: {
        pages: "Pages",
        "browse all pages, preview, and filter.":
          "Browse all pages, preview, and filter.",
      },
    },
  },
  "locale-switcher": {
    "current locale of the website": "current locale of the website",
    en: "English (EN)",
    ar: "العربية (AR)",
  },

  "form-fields": {
    name: {
      "full name": "Full Name",
      "joe doe": "Joe Doe",

      name: "Name",
      "ovve games": "Ovve Games",
    },
    email: { email: "Email" },
    "verification code": { "verification code": "Verification Code" },
    password: { password: "Password", "confirm password": "confirm password" },

    username: {
      username: "Username",
      ovvegames: "ovvegames",
    },
    logo: { logo: "Logo" },
    category: {
      category: "Category",
      "fashion and apparel": "Fashion and Apparel",
    },
    currency: {
      currency: "Currency",
      USD: "USD",
    },
    language: {
      language: "Language",
      EN: "English",
    },
    bio: {
      bio: "Bio",
      "type about your store...": "Type about your store...",
    },
    location: {
      street: {
        street: "Street",
        "03 aprt., 808 building": "03 Aprt., 808 Building",
      },
      postalCode: { postalCode: "Postal Code", "185047": "185047" },
      state: { state: "State", obour: "Obour" },
      city: { city: "City", cairo: "Cairo" },
      country: { country: "Country", egypt: "Egypt" },
    },

    // commons
    "are you absolutely sure that you want to delete this transactions?":
      "هل أنت متأكد تمامًا أنك تريد حذف هذه المعاملة النقدية؟",
    "this action cannot be undone. this will permanently delete your account and remove your data from our servers.":
      "لا يمكن التراجع عن هذا الإجراء. سيؤدي ذلك إلى طلب السحب نهائيًا وإزالته من خوادمنا.",

    "created successfully.": "created successfully.",
    "updated successfully.": "updated successfully.",
    "deleted successfully.": "deleted successfully.",
    "resend code": "Resend Code",
    "save changes": "Save Changes",
    verify: "Verify",
    confirm: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    logout: "Logout",

    "pick a date": "Pick a date",
    "message sent successfully": "message sent successfully",
    "update data": "تحديث البيانات",
    "update preferences": "تحديث التفضيلات",
    all: "الكل",
    "check code": "التحقق من الكود",
    "next step": "الخطوة التالية",
    "pre step": "الخطوة السابقة",
    back: "العودة",
    discard: "تجاهل",
  },
  // ui/data-table
  "data-table-column-header": {
    asc: "تصاعدي",
    desc: "تنازلي",
    hide: "إخفاء",
  },
  "data-table-pagination": {
    of: "من",
    "row(s) selected.": "صف(وف) مختار(ة).",
    "rows per page": "الصفوف لكل صفحة",
    "go to first page": "انتقل إلى الصفحة الأولى",
    "go to previous page": "انتقل إلى الصفحة السابقة",
    "go to next page": "انتقل إلى الصفحة التالية",
    "go to last page": "انتقل إلى الصفحة الأخيرة",
    page: "الصفحة",
  },
  "data-table-row-actions": {
    actions: "التحرير",
    "open menu": "إفتح القائمة",
  },
  "data-table": {
    "no results.": "لا توجد نتائج.",
  },

  "date-picker-with-range": {
    "pick a date": "إختر تاريخ",
    today: "اليوم",
    yesterday: "أمس",
    "last hour": "آخر ساعة",
    "last 7 days": "آخر 7 أيام",
    "last 14 days": "آخر 14 يوم",
    "last 30 days": "آخر 30 يوم",
    "custom range": "تحديد مدة معينة",
    start: "بداية من",
    end: "نهاية في",
  },
  "settings-appearance-form": {
    theme: "الثيم",
    "automatically switch between day and night themes.":
      "التبديل التلقائي بين الثيمات النهارية والليلية.",
    light: "فاتح",
    dark: "داكن",
    system: "نظام",
    language: "اللغة",
    "automatically switch between languages.": "التبديل التلقائي بين اللغات.",
    "update preferences": "تحديث التفضيلات",
  },

  actions: {
    "An unexpected error occured, please try again later.":
      "An unexpected error occured, please try again later.",
    // users: {
    "you don't have access to do this action":
      "you don't have access to do this action",
    "this action needs you to be logged in.":
      "this action needs you to be logged in.",
    "this email has been already used.": "This email has been already used.",
    "incorrect email address.": "Incorrect email address.",
    "incorrect password": "Incorrect password",
    "no password setted to that account, login using google.":
      "No password setted to that account, Login using Google.",
    "you are not logged in.": "You are not logged in.",

    "your user account was not logged in. please try again.":
      "your user account was not logged in. Please try again.",
    "your user account was not created. please try again.":
      "your user account was not created. Please try again.",
    "your user account was not updated. please try again.":
      "your user account was not updated. Please try again.",
    "your user account was not deleted. please try again.":
      "your user account was not deleted. Please try again.",

    // stores: {
    "your store was not created. please try again.":
      "your store was not created. Please try again.",
    "your store was not updated. please try again.":
      "your store was not updated. Please try again.",
    "your store was not deleted. please try again.":
      "your store was not deleted. Please try again.",

    // pages: {
    "your page was not created. please try again.":
      "your page was not created. Please try again.",
    "your page was not updated. please try again.":
      "your page was not updated. Please try again.",
    "your page was not deleted. please try again.":
      "your page was not deleted. Please try again.",

    // products: {
    "your product was not created. please try again.":
      "your product was not created. Please try again.",
    "your product was not updated. please try again.":
      "your product was not updated. Please try again.",
    "your product was not deleted. please try again.":
      "your product was not deleted. Please try again.",

    // orders: {
    "your order was not created. please try again.":
      "your order was not created. Please try again.",
    "your order was not updated. please try again.":
      "your order was not updated. Please try again.",
    "your order was not deleted. please try again.":
      "your order was not deleted. Please try again.",

    // reviews: {
    "your review was not created. please try again.":
      "your review was not created. Please try again.",
    "your review was not updated. please try again.":
      "your review was not updated. Please try again.",
    "your review was not deleted. please try again.":
      "your page was not deleted. Please try again.",
  },

  db: {
    enums: {
      "user-roles": [
        { value: "ADMIN", children: "Admin" },
        { value: "USER", children: "User" },
        { value: "MERCHANT", children: "Merchant" },
      ] satisfies (SelectItem & { value: UserRole })[],

      "product-statuses": [
        { value: "DRAFT", children: "Draft" },
        { value: "ACTIVE", children: "Active" },
        { value: "ARCHIVED", children: "Archived" },
      ] satisfies (SelectItem & { value: ProductStatus })[],

      "order-statuses": [
        { value: "PENDING", children: "Pending" },
        { value: "CONFIRMED", children: "Confirmed" },
        { value: "PROCESSING", children: "Processing" },
        { value: "SHIPPED", children: "Shipped" },
        { value: "DELIVERED", children: "Delivered" },
        { value: "CANCELLED", children: "Cancelled" },
        { value: "REFUNDED", children: "Refunded" },
      ] satisfies (SelectItem & { value: OrderStatus })[],

      "payment-statuses": [
        { value: "PENDING", children: "Pending" },
        { value: "COMPLETED", children: "Completed" },
        { value: "FAILED", children: "Failed" },
        { value: "REFUNDED", children: "Refunded" },
      ] satisfies (SelectItem & { value: PaymentStatus })[],
    },
  },
  emails: {
    "verify-email": {
      subject: "Verify Your Email - ConCom Services",
      title: "Activate Your Account",
      greeting: "Hello",
      message:
        "Thank you for registering with ConCom Services. Please verify your email using the code below:",
      codeMessage: "Your verification code is:",
      validityMessage: "This code is valid for 30 minutes only.",
      helpText: "If you didn't create this account, please ignore this email.",
      contactMessage: "For assistance, please contact us at:",
    },
    "password-reset-link": {
      subject: "Password Reset - ConCom Services",
      title: "Reset Your Password",
      greeting: "Hello",
      message:
        "We received a request to reset your account password. Use the code below to reset your password:",
      codeMessage: "Your reset code is:",
      validityMessage: "This code is valid for 15 minutes only.",
      warningMessage:
        "If you didn't request a password reset, please change your password immediately and notify us.",
      contactMessage: "For assistance, please contact us at:",
    },
  },
};

export default en;
