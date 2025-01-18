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
    name: "كن رقمي",
    description:
      "منصتنا تقدم خدمات أتمتة وسائل التواصل الاجتماعي المتقدمة باستخدام تقنية الذكاء الاصطناعي الحديثة. نحن نساعد العملاء في تنفيذ حملات تسويقية متكاملة خصيصًا لمشاريع العقارات. من خلال تحليل البيانات وتوقعات السوق، نقدم حلولاً مبتكرة تعزز الاستهداف، تزيد من تفاعل المحتوى، وتحسن أداء الحملات التسويقية. هدفنا هو تمكين العملاء من الوصول إلى جمهورهم المستهدف بكفاءة، وزيادة مبيعات العقارات بشكل استراتيجي، مع تقليل التكاليف وتسريع تحقيق النتائج.",
  },

  auth: {
    login: {
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
    "main-nav": [
      {
        segments: [null],
        value: Paths.Dashboard,
        children: "نظرة عامة",
        icon: "dashboard",
      },
      {
        segments: ["stores"],
        value: Paths.DashboardStores,
        children: "المتاجر",
        icon: "store",
      },
    ] as NavItem[],
    "user-nav": [
      {
        segments: ["settings"],
        value: Paths.DashboardSettings,
        children: "الإعدادات",
        icon: "settings",
      },
    ] as NavItem[],
    overview: {
      overview: "نظرة عامة",
      "browse all overview, edit, and filter.":
        "يمكنك تصفح وتعديل وتصفية جميع نظرة عامة.",
    },
    stores: {
      stores: "المتاجر",
      "browse all stores, edit, and filter.":
        "يمكنك تصفح وتعديل وتصفية جميع المتاجر.",
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
        {
          segments: ["customers"],
          value: "/customers",
          children: "العملاء",
          icon: "users",
        },
        {
          segments: ["reviews"],
          value: "/reviews",
          children: "التقييمات",
          icon: "stars",
        },
        {
          segments: ["promotions"],
          value: "/promotions",
          children: "العروض",
          icon: "percent",
        },
        {
          segments: ["pages"],
          value: "/pages",
          children: "الصفحات التعريفية",
          icon: "files",
        },
      ] as NavItem[],
      "user-nav": [
        {
          segments: ["settings"],
          value: "/settings",
          children: "الإعدادات",
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
      "full name": "الاسم الكامل",
      "joe doe": "جو دو",

      name: "الإسم",
      "ovve games": "متجر أوفي للألعاب",
    },
    email: { email: "البريد الإلكتروني" },
    "verification code": { "verification code": "Verification Code" },
    password: {
      password: "كلمة المرور",
      "confirm password": "تأكيد كلمة المرور",
    },
    username: {
      username: "الإسم التعريفي",
      ovvegames: "ovvegames",
    },
    logo: { logo: "الصورة التعريفية" },
    bio: {
      bio: "الوصف",
      "type about your store...": "قُم بوصف متجرك...",
    },
    category: {
      category: "التصنييف",
      "fashion and apparel": "الملابس والتصاميم",
    },
    currency: {
      currency: "العملة",
      USD: "USD",
    },
    language: {
      language: "اللغة",
      EN: "English",
    },
    location: {
      street: {
        street: "العنوان بالتفصيل",
        "03 aprt., 808 building": "الشقة 3، المبني رقم 800",
      },
      postalCode: { postalCode: "رقم البريد", "185047": "185047" },
      state: { state: "الولاية", obour: "العبور" },
      city: { city: "المدينة", cairo: "القاهرة" },
      country: { country: "الدولة", egypt: "مصر" },
    },

    // commons
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
    enums: {
      "user-roles": [
        { value: "ADMIN", children: "الأدمن" },
        { value: "USER", children: "مستخدم" },
        { value: "MERCHANT", children: "بائع" },
      ] satisfies (SelectItem & { value: UserRole })[],

      "product-statuses": [
        { value: "DRAFT", children: "مسودة" },
        { value: "ACTIVE", children: "نشط" },
        { value: "ARCHIVED", children: "مؤرشف" },
      ] satisfies (SelectItem & { value: ProductStatus })[],

      "order-statuses": [
        { value: "PENDING", children: "قيد الانتظار" },
        { value: "CONFIRMED", children: "مؤكد" },
        { value: "PROCESSING", children: "قيد المعالجة" },
        { value: "SHIPPED", children: "تم الشحن" },
        { value: "DELIVERED", children: "تم التوصيل" },
        { value: "CANCELLED", children: "ملغي" },
        { value: "REFUNDED", children: "مسترد" },
      ] satisfies (SelectItem & { value: OrderStatus })[],

      "payment-statuses": [
        { value: "PENDING", children: "قيد الانتظار" },
        { value: "COMPLETED", children: "مكتمل" },
        { value: "FAILED", children: "فشل" },
        { value: "REFUNDED", children: "مسترد" },
      ] satisfies (SelectItem & { value: PaymentStatus })[],
    },
  },

  emails: {
    "verify-email": {
      subject: "تأكيد البريد الإلكتروني - ConCom Services",
      title: "تفعيل حسابك",
      greeting: "مرحباً",
      message:
        "شكراً لتسجيلك في ConCom Services. يرجى تأكيد بريدك الإلكتروني باستخدام الرمز أدناه:",
      codeMessage: "رمز التحقق الخاص بك هو:",
      validityMessage: "هذا الرمز صالح لمدة 30 دقيقة فقط.",
      helpText:
        "إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذا البريد الإلكتروني.",
      contactMessage: "للمساعدة، يرجى التواصل معنا على:",
    },
    "password-reset-link": {
      subject: "إعادة تعيين كلمة المرور - ConCom Services",
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
};

export default ar;
