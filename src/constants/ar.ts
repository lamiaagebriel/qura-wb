const ar = {
  site: {
    name: "كن رقمي",
    description:
      "منصتنا تقدم خدمات أتمتة وسائل التواصل الاجتماعي المتقدمة باستخدام تقنية الذكاء الاصطناعي الحديثة. نحن نساعد العملاء في تنفيذ حملات تسويقية متكاملة خصيصًا لمشاريع العقارات. من خلال تحليل البيانات وتوقعات السوق، نقدم حلولاً مبتكرة تعزز الاستهداف، تزيد من تفاعل المحتوى، وتحسن أداء الحملات التسويقية. هدفنا هو تمكين العملاء من الوصول إلى جمهورهم المستهدف بكفاءة، وزيادة مبيعات العقارات بشكل استراتيجي، مع تقليل التكاليف وتسريع تحقيق النتائج.",
  },

  "locale-switcher": {
    "current locale of the website": "current locale of the website",
    en: "English (EN)",
    ar: "العربية (AR)",
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
  },

  functions: {
    waitsUntil: ({ duration }: { duration: string }) =>
      `رجاء الإنتظار لمدة ${duration} حتي ترسل مرة أخري.`,
  },
};

export default ar;
