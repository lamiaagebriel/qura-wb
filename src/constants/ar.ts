import { NavItem, SelectItem } from "@/types";
import { ProductStatus } from "@prisma/client";

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
		},
		register: {
			login: "تسجيل الدخول",
			"create an account!": "إنشاء حساب!",
			"join our community and unlock amazing features to streamline your work and boost your productivity.":
				"انضم إلى مجتمعنا واستمتع بميزات مذهلة لتسهيل عملك وزيادة إنتاجيتك.",
			"by clicking continue, you agree to our": "بالنقر على متابعة، فإنك توافق على",
			"terms of service": "شروط الخدمة",
			and: "و",
			"privacy policy": "سياسة الخصوصية",
		},
	},

	ss: {
		store: {
			navs: [
				{
					label: "المتجر",
					items: [
						{
							segments: [null],
							value: "/",
							label: "نظرة عامة",
							icon: "dashboard",
						},
						{
							segments: ["products"],
							value: "/products",
							label: "المنتجات",
							icon: "shirt",
						},
						{
							segments: ["orders"],
							value: "/orders",
							label: "الطلبات",
							icon: "packagePlus",
						},
						{
							segments: ["customers"],
							value: "/customers",
							label: "العملاء",
							icon: "users",
						},
						{
							segments: ["reviews"],
							value: "/reviews",
							label: "التقييمات",
							icon: "stars",
						},
						{
							segments: ["promotions"],
							value: "/promotions",
							label: "العروض",
							icon: "percent",
						},
						{
							segments: ["pages"],
							value: "/pages",
							label: "الصفحات التعريفية",
							icon: "files",
						},
					],
				},
				{
					items: [
						{
							segments: ["settings"],
							value: "/settings",
							label: "الإعدادات",
							icon: "settings",
						},
						{
							segments: ["support"],
							value: "/support",
							label: "الدعم",
							icon: "lifeBuoy",
						},
						{
							segments: ["feedback"],
							value: "/feedback",
							label: "إعطاء تقييم للموقع",
							icon: "send",
						},
					],
				},
			] as { label?: string; items: NavItem[] }[],
			userNavs: [{ value: "/pricing", label: "ترقية الحساب للبرو", icon: "stars" }] as SelectItem[],

			settings: {
				"main-nav": [
					{ segments: [null], value: "/settings", label: "الملف الشخصي" },
					{ segments: ["appearance"], value: "/settings/appearance", label: "المظهر" },
				] as NavItem[],
				settings: "الإعدادات",
				"manage your account details, privacy settings, and how others perceive you on the platform.":
					"إدارة تفاصيل حسابك، إعدادات الخصوصية، وكيفية رؤية الآخرين لك على المنصة.",
				appearance: {
					appearance: "المظهر",
					"customize your appearance settings and preferences.": "تخصيص إعدادات المظهر وتفضيلاتك.",
				},
				profile: {
					profile: "الملف الشخصي",
					"this is how others will see you on the site.":
						"هذه هي الطريقة التي سيراك بها الآخرون على الموقع.",
				},
			},
		},
	},

	// _data-table
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
	"data-table-view-options": {
		view: "عرض",
		"toggle columns": "تبديل الأعمدة",
	},
	"data-table": {
		"no results.": "لا توجد نتائج.",
	},

	// _products
	"product-form": {
		name: {
			name: "الإسم",
			"blue jacket": "جاكيت أزرق غامق",
		},
		slug: {
			slug: "الإسم التعريفي الفريد",
			"blue-jacket": "blue-jacket",
		},
		description: {
			description: "الوصف",
			"describe the product...": "قُم بوصف المُنتج...",
		},
		status: {
			status: "حالة المُنتج",
			"select status...": "إختر حالة...",
		},
		price: { price: "السعر" },
		stock: { stock: "الكمية بالمخزن" },
	},
	"product-create-button": {
		"created successfully.": "تم الإنشاء بنجاح.",
		submit: "إرسال",
		cancel: "إلغاء",
		"create product": "إنشاء مٌنتج",
		"create a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"create a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"product-delete-button": {
		"deleted successfully.": "تم الحذف بنجاح.",
		delete: "حذف المُنتج",
		confirm: "تأكيد الحذف",
		cancel: "إلغاء الحف",
		"delete product": "حذف المُنتج",
		"delete a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"delete a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"product-editor": {
		"updated successfully.": "تم التحديث بنجاح.",
		back: "العودة",
		"save changes": "حفظ التغيرات",
		discard: "تجاهل",
	},
	"products-table": {
		name: "الإسم",
		createdAt: "تم الإنشاء في",
	},
	// _products/attributes
	"attribute-form": {
		name: {
			name: "الإسم",
			sizes: "المقاس",
		},
	},

	// _stores
	"store-form": {
		name: {
			name: "الإسم",
			"ovve.eg": "متجر أوفي للألعاب",
		},
		username: {
			username: "Username",
			ovve: "ovvegames",
		},
		logo: { logo: "الصورة التعريفية" },
		bio: {
			bio: "الوصف",
			"type about your store...": "قُم بوصف متجرك...",
		},
		location: {
			"address-line": {
				"address line": "العنوان بالتفصيل",
				"03 aprt., 808 building": "الشقة 3، المبني رقم 800",
			},
			zip: { zip: "Zip", "185047": "185047" },
			state: { state: "State", obour: "العبور" },
			city: { city: "City", cairo: "القاهرة" },
			country: { country: "Country", egypt: "مصر" },
		},
	},
	"store-create-button": {
		"create store": "إنشاء متجر",
	},
	"store-create-steps": {
		"created successfully.": "تم الإنشاء بنجاح.",
		"go back": "الخطوة السابقة",
		"next step": "الخطوة التالية",
		"create store": "إنشاء المتجر",

		Sector: "القطاع",
		"Select Your Store Category": "إختر القطاع التجاري للمتجر",
		"Choose the category that best represents your store's offerings.":
			"Choose the category that best represents your store's offerings.",
		categories: [
			{ name: "إلكترونيات", icon: "Tv" },
			{ name: "Fashion and Apparel", icon: "ShoppingBag" },
			{ name: "Home and Furniture", icon: "Sofa" },
			{ name: "Health and Beauty", icon: "Heart" },
			{ name: "Groceries and Food", icon: "Utensils" },
			{ name: "Books and Stationery", icon: "BookOpen" },
			// { name: "Sports and Outdoor Equipment", icon: <Football className=" size-4" /> },
			{ name: "Toys and Games", icon: "Gamepad" },
			{
				name: "Automotive Parts and Accessories",
				icon: "Car",
			},
			{ name: "Jewelry and Accessories", icon: "Diamond" },
			{ name: "Pet Supplies", icon: "Dog" },
			{ name: "Office Supplies", icon: "Briefcase" },
			{ name: "Baby and Kids", icon: "Baby" },
			{ name: "Arts and Crafts", icon: "Paintbrush" },
			{ name: "Musical Instruments", icon: "Music" },
			{ name: "Software and Digital Products", icon: "Code" },
		],

		Username: "الإسم الفريد للمتجر",
		"Select Your Store Unique Name": "الإسم الفريد للمتجر",
		"Choose the category that best represents your store's offerings. this could be changed later.":
			"Choose the category that best represents your store's offerings. this could be changed later.",

		"Basic Details": "Basic Details",
		"Fill These Details": "قُم بملئ هذه البيانات",
		"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi.":
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi.",
		"Address Details": "بيانات عنوان المتجر",
		"Store Address": "بيانات عنوان المتجر",
	},

	// _stores/pages
	"page-form": {
		url: {
			url: "العنوان التعريفي",
			about: "about",
		},
		title: {
			title: "العنوان",
			"about us": "عننا",
		},
		description: {
			description: "Description",
			"type the page description...": "قُم بوصف الصفحة...",
		},
		body: {
			body: "Content",
			"type the page content...": "قُم بكتابة محتوي الصحفة...",
		},
	},
	"page-create-button": {
		"create page": "إنشاء صفحة",
	},
	"page-create-steps": {
		"created successfully.": "تم الإنشاء بنجاح.",
		"go back": "الخطوة السابقة",
		"next step": "الخطوة التالية",
		"create page": "إنشاء المتجر",
	},

	// _users
	"user-form": {
		name: {
			"full name": "الاسم الكامل",
			"joe doe": "joe doe",
		},
		email: {
			email: "البريد الإلكتروني",
		},
		password: {
			password: "كلمة المرور",
		},
	},
	"logout-button": { logout: "تسجيل الخروج", "logging out...": "جاري تسجيل الخروج..." },
	"user-login-form": {
		"or continue with": "أو تابع باستخدام",
		"sign in with email": "تسجيل الدخول باستخدام البريد الإلكتروني",
		"sign in with google": "تسجيل الدخول باستخدام جوجل",
		"forgot password": "نسيت كلمة المرور؟",
	},
	"user-register-form": {
		"or continue with": "أو تابع باستخدام",
		"sign up with email": "التسجيل باستخدام البريد الإلكتروني",
		"sign up with google": "التسجيل باستخدام جوجل",
	},

	"appearance-form": {
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

	"locale-switcher": {
		"current locale of the website": "اللغة الحالية للموقع",
		en: "الإنجليزية (EN)",
		ar: "العربية (AR)",
		fr: "الفرنسية (FR)",
		de: "الألمانية (DE)",
	},

	actions: {
		"you don't have access to do this action": "لا تملك الصلاحية لهذا الفعل.",
		"this action needs you to be logged in.": "يجب أن تسجل الدخول أولاً.",
		"this email is already used.": "هذا البريد الإلكتروني مستخدم بالفعل.",
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
		"your store was not created. please try again.": "لم يتم إنشاء المتجر. يرجى المحاولة مرة أخرى.",
		"your store was not updated. please try again.":
			"لم يتم تحديث بيانات المتجر. يرجى المحاولة مرة أخرى.",
		"your store was not deleted. please try again.": "لم يتم حذف المتجر. يرجى المحاولة مرة أخرى.",

		// stores/pages: {
		"your page was not created. please try again.": "لم يتم إنشاء الصفحة. يرجى المحاولة مرة أخرى.",
		"your page was not updated. please try again.": "لم يتم تحديث الصفحة. يرجى المحاولة مرة أخرى.",
		"your page was not deleted. please try again.": "لم يتم حذف الصفحة. يرجى المحاولة مرة أخرى.",

		// products: {
		"your product was not created. please try again.":
			"لم يتم إنشاء المُنتج. يرجى المحاولة مرة أخرى.",
		"your product was not updated. please try again.":
			"لم يتم تحديث المُنتج. يرجى المحاولة مرة أخرى.",
		"your product was not deleted. please try again.":
			"لم يتم حذف المُنتج. يرجى المحاولة مرة أخرى.",
	},

	db: {
		enums: {
			"product-status": [
				{ value: "DRAFT", label: "درافت" },
				{ value: "ACTIVE", label: "مفعل" },
				{ value: "ARCHIVE", label: "أرشيف" },
			] as (SelectItem & {
				value: ProductStatus;
			})[],
		},
	},
};

export default ar;
