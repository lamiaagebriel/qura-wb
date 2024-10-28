import { SelectItem } from "@/types";
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

	"attribute-form": {
		name: {
			name: "Name",
			sizes: "Sizes",
		},
	},

	"store-form": {
		name: {
			name: "Name",
			"ovve.eg": "Ovve.eg",
		},
	},
	"store-create-button": {
		"created successfully.": "created successfully.",
		submit: "submit",
		cancel: "cancel",
		"create store": "create store",
		"create a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"create a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"store-delete-button": {
		"deleted successfully.": "deleted successfully.",
		delete: "delete",
		confirm: "confirm",
		cancel: "cancel",
		"delete store": "delete store",
		"delete a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"delete a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"store-update-button": {
		"updated successfully.": "updated successfully.",
		edit: "edit",
		submit: "submit",
		cancel: "cancel",
		"update store": "update store",
		"update a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.":
			"update a A well-structured store that helps highlight the unique features, target audience, market strategy, and performance metrics of your project.",
	},
	"stores-table": {
		name: "name",
		createdAt: "createdAt",
	},

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
	"user-register-form": {
		"or continue with": "or continue with",
		"sign up with email": "Sign Up with Email",
		"sign up with google": "Sign Up with Google",
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
