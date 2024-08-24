import { SelectItem } from "@/types";

export default {
  site: {
    name: "كن دوت كوم",
    description:
      "موقعنا يقدم خدمات متقدمة لتشغيل الأتمتة على منصات التواصل الاجتماعي باستخدام تقنيات الذكاء الاصطناعي المتطورة. نحن نساعد العملاء في تنفيذ حملات تسويقية متكاملة وموجهة خصيصاً للمشاريع العقارية. من خلال تحليل البيانات وتوقعات السوق، نوفر حلولاً مبتكرة تساعد على تحسين الاستهداف، وزيادة نسبة التفاعل مع المحتوى، ورفع مستوى أداء الحملات التسويقية. هدفنا هو تمكين العملاء من الوصول إلى جمهورهم المستهدف بكفاءة أعلى، وزيادة مبيعات العقارات بشكل استراتيجي، مع تقليل التكاليف وتسريع عملية تحقيق النتائج.",
  },
  auth: {
    login: {
      meta: { title: "تسجيل الدخول" },
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "منذ التعاون مع Deal Ai، شهدت مبيعاتنا العقارية زيادة بنسبة 40%، وبلغت رضا العملاء مستويات جديدة. لقد قامت منصتهم بتحسين عملياتنا، مما دفع إلى نمو كبير في الأعمال.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "أليكس طومسون، الرئيس التنفيذي لشركة طومسون للعقارات",
      "don't have an account? sign up now": "ليس لديك حساب؟ سجل الآن",
      "or continue with": "أو تابع باستخدام",
      "sign in with email": "تسجيل الدخول بالبريد الإلكتروني",
      "sign in with google": "تسجيل الدخول بواسطة جوجل",
      "sign in with facebook": "تسجيل الدخول بواسطة فيسبوك",
      "forgot password": "هل نسيت كلمة المرور؟",
    },
    register: {
      meta: { title: "تسجيل الإشتراك" },
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "منذ التعاون مع Deal Ai، شهدت مبيعاتنا العقارية زيادة بنسبة 40%، وبلغت رضا العملاء مستويات جديدة. لقد قامت منصتهم بتحسين عملياتنا، مما دفع إلى نمو كبير في الأعمال.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "أليكس طومسون، الرئيس التنفيذي لشركة طومسون للعقارات",
      "already have an account? sign in.": "هل لديك حساب بالفعل؟ تسجيل الدخول.",
      "or continue with": "أو تابع باستخدام",
      "sign up with email": "سجل باستخدام البريد الإلكتروني",
      "sign up with google": "سجل باستخدام جوجل",
      "sign up with facebook": "سجل باستخدام فيسبوك",
    },
  },

  "locale-switcher": {
    "current locale of the website": "اللغة الحالية للموقع",
    en: "الإنجليزية (EN)",
    ar: "العربية (AR)",
    fr: "الفرنسية (FR)",
    de: "الألمانية (DE)",
  },
  "mode-toggle": {
    "toggle theme": "تبديل النظام",
    modes: [
      { value: "light", label: "نهاري", icon: "sun" },
      { value: "dark", label: "ليلي", icon: "moon" },
      { value: "system", label: "النظام", icon: "laptop" },
    ] as SelectItem[],
  },
  "user-form": {
    name: {
      "full name": "الاسم الكامل",
      "joe doe": "جو دو",
    },
    email: { email: "البريد الإلكتروني" },
    password: { password: "كلمة المرور" },
  },
};
