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
        segments: [],
        value: Paths.VerifyEmail,
        children: "Verify Email",
        icon: "verified",
      },
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
          segments: [],
          value: Paths.VerifyEmail,
          children: "Verify Email",
          icon: "verified",
        },
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
        product: {
          "product details": "product details",
          "product cost": "product cost",
          "product status": "product status",
          "product images": "product images",
          stock: "stock",
        },
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
    "no results.": "No Results.",
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

    users: {
      id: { id: "الرمز التعريفي" },
      createdAt: { createdAt: "CreatedAt" },
      updatedAt: { updatedAt: "UpdatedAt" },

      // Authentication fields
      googleId: { google_id: "google_id" },
      email: { email: "Email" },
      password: {
        password: "Password",
        "confirm password": "confirm password",
      },

      // Email verification
      emailVerified: { email_verified: "email_verified" },
      emailVerificationDetails: {
        code: { "verification code": "Verification Code" },
      },
      // Password reset
      resetPasswordDetails: { reset_details: "reset_details" },

      // Profile fields
      role: {
        role: "role",
        enums: {
          ADMIN: { label: "Admin" },
          USER: { label: "User" },
          MERCHANT: { label: "Merchant" },
        } satisfies Record<UserRole, { label: string }>,
      },
      name: { name: "Name" },
      image: { image: "image" },
      phone: { phone: "phone" },
      address: { address: "address" },
      preferences: { preferences: "preferences" },
    },
    stores: {
      id: { id: "id" },
      createdAt: { created_at: "created_at" },
      updatedAt: { updated_at: "updated_at" },
      userId: { user_id: "user_id" },
      username: { username: "Username", ovvegames: "ovvegames" },
      name: { name: "Name", "ovve games": "Ovve Games" },
      category: {
        category: "Category",
        "fashion and apparel": "Fashion and Apparel",
      },
      currency: {
        currency: "Currency",
        "select currency...": "select currency...",
        enums: {
          USD: { label: "USD" },
          EGY: { label: "EGY" },
          SRY: { label: "SRY" },
        },
      },
      language: {
        language: "Language",
        "select language...": "select language...",
        enums: {
          EN: { label: "English" },
          AR: { label: "Arabic" },
        },
      },
      logo: { logo: "Logo" },
      banner: { banner: "banner" },
      bio: {
        bio: "Bio",
        "type about your store...": "Type about your store...",
      },
    },

    products: {
      id: { id: "ID" },
      createdAt: { createdAt: "CreatedAt" },
      updatedAt: { updatedAt: "UpdatedAt" },
      storeId: { storeId: "StoreID" },
      slug: { slug: "slug" },
      title: { title: "title" },
      description: { description: "description" },
      status: {
        status: "status",
        "select status...": "select status...",
        enums: {
          DRAFT: { label: "Draft" },
          ACTIVE: { label: "Active" },
          ARCHIVED: { label: "Archived" },
        } satisfies Record<ProductStatus, { label: string }>,
      },
      images: { images: "images" },
      price: { price: "price" },
      discount: { discount: "discount" },
      cost: { cost: "cost" },
      tax: { tax: "tax" },
      stock: { stock: "stock" },
      isAlwaysAvailable: { isAlwaysAvailable: "is_always_available" },
      limitedAmountPerOrder: {
        limitedAmountPerOrder: "limited_amount_per_order",
      },
      sku: { sku: "sku" },
      barcode: { barcode: "barcode" },
      weight: { weight: "weight" },
      dimensions: { dimensions: "dimensions" },
      attributes: { attributes: "attributes" },
      combinations: { combinations: "combinations" },
      properties: { properties: "properties" },
      metaTitle: { metaTitle: "meta_title" },
      metaDescription: { metaDescription: "meta_description" },
      isPublished: { isPublished: "is_published" },
      publishedAt: { publishedAt: "published_at" },
    },
  },
  tables: {
    // products
    "product details": "product details",
    "created at": "created at",
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

  // Commom phrases
  cmn: {
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
    "update data": "update data",
    "update preferences": "update preferences",
    all: "All",
    "check code": "check code",
    "next step": "next step",
    "pre step": "pre step",
    back: "back",
    discard: "discard",
  },
};

export default en;
