import { NavItem, SelectItem } from "@/types";
import { ProductStatus } from "@prisma/client";

const en = {
	site: {
		name: "ConCom",
		description:
			"Our platform offers advanced social media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
	},

	auth: {
		login: {
			"back home": "Back Home",
			"welcome back!": "Welcome back!",
			"join our community and unlock amazing features to streamline your work and boost your productivity.":
				"Join our community and unlock amazing features to streamline your work and boost your productivity.",
			"don't have an account? sign up now": "Don't have an account? Sign Up now",
		},
		register: {
			login: "Login",
			"create an account!": "Create an account!",
			"join our community and unlock amazing features to streamline your work and boost your productivity.":
				"Join our community and unlock amazing features to streamline your work and boost your productivity.",
			"by clicking continue, you agree to our": "By clicking continue, you agree to our",
			"terms of service": "Terms of Service",
			and: "and",
			"privacy policy": "Privacy Policy",
		},
	},

	ss: {
		store: {
			navs: [
				{
					label: "Store",
					items: [
						{
							segments: [null],
							value: "/",
							label: "Overview",
							icon: "dashboard",
						},
						{
							segments: ["products"],
							value: "/products",
							label: "Products",
							icon: "shirt",
						},
						{
							segments: ["orders"],
							value: "/orders",
							label: "Orders",
							icon: "packagePlus",
						},
						{
							segments: ["customers"],
							value: "/customers",
							label: "Customers",
							icon: "users",
						},
						{
							segments: ["reviews"],
							value: "/reviews",
							label: "Reviews",
							icon: "stars",
						},
						{
							segments: ["promotions"],
							value: "/promotions",
							label: "Promotions",
							icon: "percent",
						},
						{
							segments: ["pages"],
							value: "/pages",
							label: "Pages",
							icon: "files",
						},
					],
				},
				{
					items: [
						{
							segments: ["settings"],
							value: "/settings",
							label: "Settings",
							icon: "settings",
						},
						{
							segments: ["support"],
							value: "/support",
							label: "Support",
							icon: "lifeBuoy",
						},
						{
							segments: ["feedback"],
							value: "/feedback",
							label: "Feedback",
							icon: "send",
						},
					],
				},
			] as { label?: string; items: NavItem[] }[],
			userNavs: [{ value: "/pricing", label: "Upgrade to Pro", icon: "stars" }] as SelectItem[],

			settings: {
				"main-nav": [
					{ segments: [null], value: "/settings/", label: "Profile" },
					{ segments: ["appearance"], value: "/settings/appearance", label: "Appearance" },
				] as NavItem[],
				settings: "Settings",
				"manage your account details, privacy settings, and how others perceive you on the platform.":
					"manage your account details, privacy settings, and how others perceive you on the platform.",

				appearance: {
					appearance: "Appearance",
					"customize your appearance settings and preferences.":
						"Customize your appearance settings and preferences.",
				},
				profile: {
					profile: "Profile",
					"this is how others will see you on the site.":
						"this is how others will see you on the site.",
				},
			},
		},
	},

	// _data-table
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
	"data-table-row-actions": {
		actions: "Actions",
		"open menu": "Open menu",
	},
	"data-table-view-options": {
		view: "View",
		"toggle columns": "Toggle columns",
	},
	"data-table": {
		"no results.": "No Results.",
	},

	// _products
	"product-form": {
		name: {
			name: "Name",
			"blue jacket": "Blue Jacket",
		},
		description: {
			description: "Description",
			"describe the product...": "Describe the product...",
		},
		status: {
			status: "Status",
			"select status...": "select status...",
		},
		price: {
			price: "Price",
		},
		stock: {
			stock: "Stock",
		},
	},
	"product-create-button": {
		"created successfully.": "created successfully.",
		submit: "submit",
		cancel: "cancel",
		"create product": "create product",
		"create a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"create a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"product-delete-button": {
		"deleted successfully.": "deleted successfully.",
		delete: "delete",
		confirm: "confirm",
		cancel: "cancel",
		"delete product": "delete product",
		"delete a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"delete a A well-structured product that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"product-editor": {
		"updated successfully.": "updated successfully.",
		back: "Back",
		"save changes": "Save Changes",
		discard: "Discard",
	},
	"products-table": {
		name: "name",
		createdAt: "createdAt",
	},
	// _products/attributes
	"attribute-form": {
		name: {
			name: "Name",
			sizes: "Sizes",
		},
	},

	// _stores
	"store-form": {
		name: {
			name: "Name",
			"ovve.eg": "Ovve.eg",
		},
		username: {
			username: "Username",
			ovve: "Ovve",
		},
		logo: {
			logo: "Logo",
		},
		bio: {
			bio: "Bio",
			"type about your store...": "Type about your store...",
		},
		location: {
			"address-line": {
				"address line": "Address Line",
				"03 aprt., 808 building": "03 Aprt., 808 Building",
			},
			zip: { zip: "Zip", "185047": "185047" },
			state: { state: "State", obour: "Obour" },
			city: { city: "City", cairo: "Cairo" },
			country: { country: "Country", egypt: "Egypt" },
		},
	},
	"store-create-button": {
		"create store": "create store",
	},
	"store-create-steps": {
		"created successfully.": "created successfully.",
		"go back": "Go back",
		"next step": "Next step",
		"create store": "Create Store",

		Sector: "Sector",
		"Select Your Store Category": "Select Your Store Category",
		"Choose the category that best represents your store's offerings.":
			"Choose the category that best represents your store's offerings.",
		categories: [
			{ name: "Electronics", icon: "Tv" },
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

		Username: "Username",
		"Select Your Store Unique Name": "Select Your Store Unique Name",
		"Choose the category that best represents your store's offerings. this could be changed later.":
			"Choose the category that best represents your store's offerings. this could be changed later.",

		"Basic Details": "Basic Details",
		"Fill These Details": "Fill These Details",
		"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi.":
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga sunt quibusdam, cum voluptas vero error eveniet animi.",
		"Address Details": "Address Details",
		"Store Address": "Store Address",
	},

	// _stores/pages
	"page-form": {
		url: {
			url: "URL",
			about: "about",
		},
		title: {
			title: "Title",
			"about us": "About Us",
		},
		description: {
			description: "Description",
			"type the page description...": "Type the page description...",
		},
		body: {
			body: "Content",
			"type the page content...": "Type the page content...",
		},
	},
	"page-create-button": {
		"create page": "Create Page",
	},
	"page-create-steps": {
		"created successfully.": "created successfully.",
		"go back": "Go back",
		"next step": "Next step",
		"create page": "Create Page",
	},

	// _users
	"user-form": {
		name: {
			"full name": "Full Name",
			"joe doe": "Joe Doe",
		},
		email: {
			email: "Email",
		},
		password: {
			password: "Password",
		},
	},
	"user-login-form": {
		"or continue with": "or continue with",
		"sign in with email": "Sign In with Email",
		"sign in with google": "Sign In with Google",
		"forgot password": "Forgot Password?",
	},
	"logout-button": { logout: "Logout", "logging out...": "logging out..." },
	"user-register-form": {
		"or continue with": "or continue with",
		"sign up with email": "Sign Up with Email",
		"sign up with google": "Sign Up with Google",
	},

	"appearance-form": {
		theme: "Theme",
		"automatically switch between day and night themes.":
			"Automatically switch between day and night themes.",
		light: "Light",
		dark: "Dark",
		system: "System",
		language: "Language",
		"automatically switch between languages.": "Automatically switch between languages.",
		"update preferences": "update preferences",
	},

	"locale-switcher": {
		"current locale of the website": "current locale of the website",
		en: "English (EN)",
		ar: "العربية (AR)",
		fr: "French (FR)",
		de: "Deautch (DE)",
	},

	actions: {
		// users: {
		"you don't have access to do this action": "you don't have access to do this action",
		"this action needs you to be logged in.": "this action needs you to be logged in.",
		"this email is already used.": "This email is already used.",
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

		// stores/pages: {
		"your page was not created. please try again.": "your page was not created. Please try again.",
		"your page was not updated. please try again.": "your page was not updated. Please try again.",
		"your page was not deleted. please try again.": "your page was not deleted. Please try again.",

		// products: {
		"your product was not created. please try again.":
			"your product was not created. Please try again.",
		"your product was not updated. please try again.":
			"your product was not updated. Please try again.",
		"your product was not deleted. please try again.":
			"your product was not deleted. Please try again.",
	},

	db: {
		enums: {
			"product-status": [
				{ value: "DRAFT", label: "Draft" },
				{ value: "ACTIVE", label: "Active" },
				{ value: "ARCHIVE", label: "Archive" },
			] as (SelectItem & {
				value: ProductStatus;
			})[],
		},
	},
};

export default en;
