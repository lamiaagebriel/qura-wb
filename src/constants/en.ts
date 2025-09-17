import { Paths } from "@/constants";
import { NavItem } from "@/types";

import { UserRole } from "@/lib/validations";

const en = {
  site: {
    name: "Qura",
    description:
      "Our platform offers advanced sociasl media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
  },
  auth: {
    login: {
      login: "Login",
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
      register: "Register",
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
    "user-nav": [
      {
        segments: [],
        value: Paths.VerifyEmail,
        children: "Verify Email",
        icon: "verified",
      },
      {
        segments: ["dashboard"],
        value: Paths.Dashboard,
        children: "Dashboard",
        icon: "dashboard",
      },
      {
        segments: ["settings"],
        value: Paths.DashboardSettings,
        children: "Settings",
        icon: "settings",
      },
    ] as NavItem[],

    overview: {
      dashboard: "Dashboard",
      "create, browse, edit, and filter all orders easily.":
        "create, browse, edit, and filter all orders easily.",
    },
    stores: {
      stores: "Stores",
      "create, browse, edit, and filter all stores easily.":
        "create, browse, edit, and filter all stores easily.",
    },
    settings: {
      "main-nav": [
        {
          segments: [null],
          value: Paths.DashboardSettings,
          children: "Profile",
        },
        {
          segments: [Paths.DashboardSettingsAppearance?.split("/")?.pop()],
          value: Paths.DashboardSettingsAppearance,
          children: "Appearance",
        },
      ] as NavItem[],

      settings: "Settings",
      "manage your account details, privacy settings, and how others perceive you on the platform.":
        "manage your account details, privacy settings, and how others perceive you on the platform.",

      profile: {
        profile: "Profile",
        "this is how others will see you on the site.":
          "this is how others will see you on the site.",
      },
      appearance: {
        appearance: "Appearance",
        "customize your appearance settings and preferences.":
          "customize your appearance settings and preferences.",
      },
    },
  },
  "mode-switcher": {
    theme: "Theme",
    "automatically switch between day and night themes.":
      "Automatically switch between day and night themes.",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  actions: {
    "an unexpected error occured, please try again later.":
      "An unexpected error occured, please try again later.",

    // users:
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
  },

  emails: {
    "verify-email": {
      subject: "Verify Your Email - Qura Services",
      title: "Activate Your Account",
      greeting: "Hello",
      message:
        "Thank you for registering with Qura Services. Please verify your email using the code below:",
      codeMessage: "Your verification code is:",
      validityMessage: "This code is valid for 30 minutes only.",
      helpText: "If you didn't create this account, please ignore this email.",
      contactMessage: "For assistance, please contact us at:",
    },
    "password-reset-link": {
      subject: "Password Reset - Qura Services",
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

  db: {
    users: {
      id: { id: "Identifier" },
      createdAt: { createdAt: "CreatedAt" },
      updatedAt: { updatedAt: "UpdatedAt" },

      // Authentication fields
      googleId: { google_id: "Google Id" },
      email: {
        email: "Email",
        "this email addresses is verified & immutable.":
          "this email addresses is verified & immutable.",
        "this email addresses is needs to be verified or changed.":
          "this email addresses is needs to be verified or changed.",
      },
      password: {
        password: "Password",
        "confirm password": "Confirm Password",
      },

      // Email verification
      emailVerified: { email_verified: "Email Verified" },
      emailVerificationDetails: {
        code: { "verification code": "Verification Code" },
      },
      // Password reset
      resetPasswordDetails: {
        reset_password_details: "Reset Password Details",
      },

      // Profile fields
      role: {
        role: "Role",
        enums: {
          ADMIN: { label: "Admin" },
          USER: { label: "User" },
          MERCHANT: { label: "Merchant" },
        } satisfies Record<UserRole, { label: string }>,
      },
      name: { name: "Name" },
      image: { image: "Image" },
      phone: { phone: "Phone" },
      address: { address: "Address" },
      preferences: { preferences: "Preferences" },
    },
  },

  // Commom phrases
  cmn: {
    "are you absolutely sure that you want to delete this transactions?":
      "Are you absolutely sure that you want to delete this transactions?",
    "this action cannot be undone. this will permanently delete your account and remove your data from our servers.":
      "This action cannot be undone. this will permanently delete your account and remove your data from our servers.",

    "created successfully.": "created successfully.",
    "updated successfully.": "updated successfully.",
    "deleted successfully.": "deleted successfully.",
    "work with us": "work with us",
    "resend code": "Resend Code",
    "save changes": "Save Changes",
    verify: "Verify",
    confirm: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    logout: "Logout",
    signup: "Sign Up",

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
    preview: "preview",

    "create product": "create product",
    "create store": "create store",
  },
};

export default en;
