import { NavItem, SelectItem } from "@/types";

import {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from "@/lib/validations";

import { Paths } from "./utils";

const ar = {
  site: {
    name: "كُن رقمي",
    description:
      "منصتنا تقدم خدمات أتمتة وسائل التواصل الاجتماعي المتقدمة باستخدام تقنية الذكاء الاصطناعي الحديثة. نحن نساعد العملاء في تنفيذ حملات تسويقية متكاملة خصيصًا لمشاريع العقارات. من خلال تحليل البيانات وتوقعات السوق، نقدم حلولاً مبتكرة تعزز الاستهداف، تزيد من تفاعل المحتوى، وتحسن أداء الحملات التسويقية. هدفنا هو تمكين العملاء من الوصول إلى جمهورهم المستهدف بكفاءة، وزيادة مبيعات العقارات بشكل استراتيجي، مع تقليل التكاليف وتسريع تحقيق النتائج.",
  },

  auth: {
    login: {
      login: "تسجيل الدخول",
      "back home": "العودة إلى الصفحة الرئيسية",
      "welcome back!": "مرحبًا بعودتك!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "انضم إلى مجتمعنا واستمتع بميزات مذهلة لتسهيل عملك وزيادة إنتاجيتك.",
      "don't have an account? sign up now": "ليس لديك حساب؟ اشترك الآن",
      "or continue with": "أو تابع باستخدام",
      "sign in with email": "تسجيل الدخول باستخدام البريد الإلكتروني",
      "sign in with google": "تسجيل الدخول باستخدام جوجل",
      "forgot password": "نسيت كلمة المرور؟",
    },
    register: {
      register: "إنشاء حساب",
      login: "تسجيل الدخول",
      "create an account!": "إنشاء حساب!",
      "join our community and unlock amazing features to streamline your work and boost your productivity.":
        "انضم إلى مجتمعنا واستمتع بميزات مذهلة لتسهيل عملك وزيادة إنتاجيتك.",
      "by clicking continue, you agree to our":
        "بالنقر على متابعة، فإنك توافق على",
      "terms of service": "شروط الخدمة",
      and: "و",
      "privacy policy": "سياسة الخصوصية",
      "or continue with": "أو تابع باستخدام",
      "sign up with email": "التسجيل باستخدام البريد الإلكتروني",
      "sign up with google": "التسجيل باستخدام جوجل",
    },
    "forgot-password": {
      login: "تسجيل الدخول",
      "forgot password?": "نسيت كلمة المرور؟",
      "password reset link will be sent to your email.":
        "سيتم إرسال لينك إعادة تعيين كلمة المرور إلي بريدك الإلكتروني.",
      "don't have an account? sign up now": "ليس لديك حساب؟ اشترك الآن",
    },
    "reset-password": {
      "back home": "العودة إلى الصفحة الرئيسية",
      "reset password": "إعادة تعيين كلمة المرور",
      "enter a new strong password twice.":
        "قُم بإدخال كلمة مرور جديدة قوية مرتين للتأكيد.",
      "remember password? login now": "تتذكر كلمة المرور؟ سجل الدخول الآن.",
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
    "user-nav": [
      {
        segments: [],
        value: Paths.VerifyEmail,
        children: "توثيق الحساب",
        icon: "verified",
      },
      {
        segments: ["settings"],
        value: Paths.DashboardSettings,
        children: "الإعدادات",
        icon: "settings",
      },
    ] as NavItem[],
    overview: {
      stores: "المتاجر",
      "create, browse, edit, and filter all stores easily.":
        "قم بإضافة وتصفح جميع المتاجر والتعديل والتصفية بكل سهولة.",
    },
    settings: {
      "main-nav": [
        {
          segments: [null],
          value: Paths.DashboardSettings,
          children: "الملف الشخصي",
        },
        {
          segments: [Paths.DashboardSettingsAppearance?.split("/")?.pop()],
          value: Paths.DashboardSettingsAppearance,
          children: "المظهر",
        },
      ] as NavItem[],
      settings: "الإعدادات",
      "manage your account details, privacy settings, and how others perceive you on the platform.":
        "إدارة تفاصيل حسابك، إعدادات الخصوصية، وكيفية رؤية الآخرين لك على المنصة.",

      profile: {
        profile: "الملف الشخصي",
        "this is how others will see you on the site.":
          "هذه هي الطريقة التي سيراك بها الآخرون على الموقع.",
      },
      appearance: {
        appearance: "المظهر",
        "customize your appearance settings and preferences.":
          "تخصيص إعدادات المظهر وتفضيلاتك.",
      },
    },
  },

  stores: {
    store: {
      "main-nav": [
        {
          segments: [null],
          value: "/",
          children: "نظرة عامة",
          icon: "dashboard",
        },
        {
          segments: ["products"],
          value: "/products",
          children: "المنتجات",
          icon: "shirt",
        },
        {
          segments: ["orders"],
          value: "/orders",
          children: "الطلبات",
          icon: "packagePlus",
        },
        // {
        //   segments: ["customers"],
        //   value: "/customers",
        //   children: "العملاء",
        //   icon: "users",
        // },
        // {
        //   segments: ["reviews"],
        //   value: "/reviews",
        //   children: "التقييمات",
        //   icon: "stars",
        // },
        // {
        //   segments: ["promotions"],
        //   value: "/promotions",
        //   children: "العروض",
        //   icon: "percent",
        // },
        // {
        //   segments: ["pages"],
        //   value: "/pages",
        //   children: "الصفحات التعريفية",
        //   icon: "files",
        // },
      ] as NavItem[],
      overview: "Overview",
      "browse all overview, edit, and filter.":
        "Browse all overview, edit, and filter.",

      products: {
        products: "المنتجات",
        "create, browse, edit, and filter all products easily.":
          "قم بإضافة وتصفح جميع المنتجات، والتعديل والتصفية بكل سهولة.",

        product: {
          "product details": "تفاصيل المُنتج",
          "product cost": "تكلفة المُنتج",
          "product status": "حالة المُنتج",
          "product images": "صور المُنتج",
          stock: "الكميات المتوفرة",
          attributes: "المتغيرات",
        },
      },
      orders: {
        orders: "الطلبات",
        "create, browse, edit, and filter all orders easily.":
          "قم بإضافة وتصفح جميع الطلبات والتعديل والتصفية بكل سهولة.",

        order: {
          "order details": "تفاصيل الطلب",
          "order status": "حالة الطلب",
        },
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
  },

  actions: {
    "An unexpected error occured, please try again later.":
      "حدث خطأ ما، الرجاء المحاولة في وقت لاحق.",
    // users: {
    "you don't have access to do this action": "لا تملك الصلاحية لهذا الفعل.",
    "this action needs you to be logged in.": "يجب أن تسجل الدخول أولاً.",
    "this email has been already used.": "هذا البريد الإلكتروني مستخدم بالفعل.",
    "incorrect email address.": "عنوان البريد الإلكتروني غير صحيح.",
    "incorrect password": "كلمة المرور غير صحيحة",
    "no password setted to that account, login using google.":
      "لم يتم تعيين كلمة مرور لهذا الحساب، قم بتسجيل الدخول باستخدام جوجل.",
    "you are not logged in.": "أنت غير مسجل الدخول.",
    "your user account was not logged in. please try again.":
      "لم يتم تسجيل حساب المستخدم الخاص بك. يرجى المحاولة مرة أخرى.",
    "your user account was not created. please try again.":
      "لم يتم إنشاء حساب المستخدم الخاص بك. يرجى المحاولة مرة أخرى.",
    "your user account was not updated. please try again.":
      "لم يتم تحديث حساب المستخدم الخاص بك. يرجى المحاولة مرة أخرى.",
    "your user account was not deleted. please try again.":
      "لم يتم حذف حساب المستخدم الخاص بك. يرجى المحاولة مرة أخرى.",

    // stores: {
    "your store was not created. please try again.":
      "لم يتم إنشاء المتجر. يرجى المحاولة مرة أخرى.",
    "your store was not updated. please try again.":
      "لم يتم تحديث بيانات المتجر. يرجى المحاولة مرة أخرى.",
    "your store was not deleted. please try again.":
      "لم يتم حذف المتجر. يرجى المحاولة مرة أخرى.",

    // pages: {
    "your page was not created. please try again.":
      "لم يتم إنشاء الصفحة. يرجى المحاولة مرة أخرى.",
    "your page was not updated. please try again.":
      "لم يتم تحديث الصفحة. يرجى المحاولة مرة أخرى.",
    "your page was not deleted. please try again.":
      "لم يتم حذف الصفحة. يرجى المحاولة مرة أخرى.",

    // products: {
    "your product was not created. please try again.":
      "لم يتم إنشاء المنتج. يرجى المحاولة مرة أخرى.",
    "your product was not updated. please try again.":
      "لم يتم تحديث المنتج. يرجى المحاولة مرة أخرى.",
    "your product was not deleted. please try again.":
      "لم يتم حذف المنتج. يرجى المحاولة مرة أخرى.",

    // orders: {
    "your order was not created. please try again.":
      "لم يتم إنشاء الطلب. يرجى المحاولة مرة أخرى.",
    "your order was not updated. please try again.":
      "لم يتم تحديث الطلب. يرجى المحاولة مرة أخرى.",
    "your order was not deleted. please try again.":
      "لم يتم حذف الطلب. يرجى المحاولة مرة أخرى.",

    // reviews: {
    "your review was not created. please try again.":
      "لم يتم إنشاء التقييم. يرجى المحاولة مرة أخرى.",
    "your review was not updated. please try again.":
      "لم يتم تحديث التقييم. يرجى المحاولة مرة أخرى.",
    "your review was not deleted. please try again.":
      "لم يتم حذف التقييم. يرجى المحاولة مرة أخرى.",
  },

  db: {
    users: {
      id: { id: "الرمز التعريفي" },
      createdAt: { createdAt: "CreatedAt" },
      updatedAt: { updatedAt: "UpdatedAt" },

      // Authentication fields
      googleId: { google_id: "google_id" },
      email: {
        email: "البريد الإلكتروني",
        "this email addresses is verified & immutable.":
          "هذا البريد الإلكتروني موثق وغير قابل للتغيير",
        "this email addresses is needs to be verified or changed.":
          "هذا البريد الإلكتروني يحتاج للتوثيق او تغييره.",
      },
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
      name: { name: "الإسم" },
      image: { image: "صورة البروفايل" },
      phone: { phone: "رقم الهاتف" },
      address: { address: "العنوان" },
      preferences: { preferences: "التفضيلات" },
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
      slug: { slug: "الإسم التعريفي" },
      title: { title: "العنوان" },
      description: { description: "الوصف" },
      status: {
        status: "status",
        "select status...": "إختر حالة...",
        enums: {
          DRAFT: { label: "مسودة", color: "hsl(var(--chart-2))" },
          ACTIVE: { label: "نشط", color: "hsl(var(--chart-3))" },
          ARCHIVED: { label: "مؤرشف", color: "hsl(var(--chart-5))" },
        } satisfies Record<ProductStatus, { label: string; color: string }>,
      },
      images: { images: "الصور" },
      price: { price: "السعر" },
      compareToPrice: { "compare to price": "السعر قبل الخصم" },
      cost: { cost: "تكلفة المنتج" },
      tax: { tax: "tax" },
      stock: { stock: "الكمية بالمخزن" },
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

    orders: {
      id: { id: "الرقم التعريفي" },
      createdAt: { createdAt: "تاريخ الإنشاء" },
      updatedAt: { updatedAt: "أخر تعديل" },
      storeId: { storeId: "الرقم التعريفي للمتجر" },
      userId: { userId: "الرقم التعريفي للمستخدم" },

      status: {
        status: "الحالة",
        "select status...": "أختر حالة...",
        enums: {
          PENDING: { label: "قيد الانتظار", color: "hsl(var(--chart-2))" },
          CONFIRMED: { label: "مؤكد", color: "hsl(var(--chart-3))" },
          PROCESSING: { label: "قيد المعالجة", color: "hsl(var(--chart-2))" },
          SHIPPED: { label: "تم الشحن", color: "hsl(var(--chart-2))" },
          DELIVERED: { label: "تم التوصيل", color: "hsl(var(--chart-2))" },
          CANCELLED: { label: "ملغي", color: "hsl(var(--chart-1))" },
          REFUNDED: { label: "مسترد", color: "hsl(var(--chart-5))" },
        } satisfies Record<OrderStatus, { label: string; color: string }>,
      },
      paymentStatus: {
        status: "الحالة",
        "select status...": "أختر حالة...",
        enums: {
          PENDING: { label: "قيد الانتظار", color: "hsl(var(--chart-2))" },
          COMPLETED: { label: "مكتمل", color: "hsl(var(--chart-3))" },
          FAILED: { label: "فشل", color: "hsl(var(--chart-1))" },
          REFUNDED: { label: "مسترد", color: "hsl(var(--chart-5))" },
        } satisfies Record<PaymentStatus, { label: string; color: string }>,
      },
      total: { total: "total" },
    },
  },
  tables: {
    // products
    "product details": "بيانات المُنتج",
    price: "السعر",
    profit: "المكسب",
    stock: "الكمية بالمخزن",
    status: "حالة المُنتج",
    "created at": "تاريخ الإنشاء",

    // cart
    quantity: "الكمية",
  },
  emails: {
    "verify-email": {
      subject: "تأكيد البريد الإلكتروني - خدمات كُن رقمي",
      title: "تفعيل حسابك",
      greeting: "مرحباً",
      message:
        "شكراً لتسجيلك في خدمات كُن رقمي. يرجى تأكيد بريدك الإلكتروني باستخدام الرمز أدناه:",
      codeMessage: "رمز التحقق الخاص بك هو:",
      validityMessage: "هذا الرمز صالح لمدة 30 دقيقة فقط.",
      helpText:
        "إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.",
      contactMessage: "للمساعدة، يرجى التواصل معنا على:",
    },
    "password-reset-link": {
      subject: "إعادة تعيين كلمة المرور - خدمات كُن رقمي",
      title: "إعادة تعيين كلمة المرور",
      greeting: "مرحباً",
      message:
        "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم الرمز أدناه لإعادة تعيين كلمة المرور:",
      codeMessage: "رمز إعادة التعيين هو:",
      validityMessage: "هذا الرمز صالح لمدة 15 دقيقة فقط.",
      warningMessage:
        "إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تغيير كلمة المرور الخاصة بك فوراً وإبلاغنا.",
      contactMessage: "للمساعدة، يرجى التواصل معنا على:",
    },
  },

  // Commom phrases
  cmn: {
    "are you absolutely sure that you want to delete this transactions?":
      "هل أنت متأكد تمامًا أنك تريد حذف هذه المعاملة النقدية؟",
    "this action cannot be undone. this will permanently delete your account and remove your data from our servers.":
      "لا يمكن التراجع عن هذا الإجراء. سيؤدي ذلك إلى طلب السحب نهائيًا وإزالته من خوادمنا.",

    "pick a date": "إختر التاريخ",
    "message sent successfully": "تم إرسال الرسالة بنجاح.",
    "created successfully.": "تم الإنشاء بنجاح.",
    "updated successfully.": "تم تحديث البيانات بنجاح.",
    "deleted successfully.": "تم الحذف بنجاح.",
    "resend code": "Resend Code",
    "save changes": "حفظ التغييرات",
    "update data": "تحديث البيانات",
    "update preferences": "تحديث التفضيلات",
    all: "الكل",
    "check code": "التحقق من الكود",
    "next step": "الخطوة التالية",
    "pre step": "الخطوة السابقة",
    verify: "Verify",
    back: "العودة",
    discard: "تجاهل",
    confirm: "تأكيد",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    logout: "تسجيل الخروج",
    preview: "عرض",

    "create product": "إضافة منتج جديد",
    "create store": "إضافة متجر جديد",
  },
};

export default ar;
