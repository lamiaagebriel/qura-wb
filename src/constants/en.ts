import { Paths } from "@/constants";
import { NavItem } from "@/types";

import { ProductStatus, UserRole } from "@/lib/validations";

const en = {
  site: {
    name: "Qura",
    description:
      "Our platform offers advanced sociasl media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
  },
  marketing: {
    hero: {
      headline: "Launch and grow your online store",
      subheadline: "Powerful tools, no code required.",
      ctas: { getStarted: "Get Started", talkToSales: "Talk to Sales" },
    },
    howItWorks: {
      title: "How our website works",
      subtitle:
        "Create your store in minutes. Customize, add products, and start selling.",
      steps: [
        {
          title: "Create your account",
          description: "Sign up and set your store name, domain, and branding.",
        },
        {
          title: "Add products",
          description:
            "Import or create products, set pricing, inventory, and media.",
        },
        {
          title: "Start selling",
          description:
            "Accept payments, fulfill orders, and grow with integrated tools.",
        },
      ],
    },
    benefits: {
      title: "Benefits of creating your store here",
      subtitle:
        "Everything you need to build, run, and scale your online business.",
      items: [
        {
          title: "Fast setup",
          description: "Get online quickly with presets and guided onboarding.",
        },
        {
          title: "Modern storefront",
          description: "Responsive design that looks great on any device.",
        },
        {
          title: "Secure payments",
          description: "Integrated gateways with PCI-compliant checkout.",
        },
        {
          title: "Analytics built-in",
          description: "Track sales, customers, and products in real time.",
        },
        {
          title: "Scalable infrastructure",
          description: "Backed by reliable cloud services as your store grows.",
        },
        {
          title: "24/7 support",
          description: "We’re here when you need help the most.",
        },
      ],
    },
    pricing: {
      title: "Pricing",
      subtitle: "Simple, transparent plans that grow with you.",
      popularLabel: "Popular",
      plans: {
        starter: {
          name: "Starter",
          tagline: "For new stores",
          price: "$0/mo",
          cta: "Choose Starter",
          features: [
            "Up to 25 products",
            "Basic analytics",
            "Community support",
          ],
        },
        growth: {
          name: "Growth",
          tagline: "For growing brands",
          price: "$39/mo",
          cta: "Choose Growth",
          features: [
            "Unlimited products",
            "Advanced analytics",
            "Priority support",
          ],
        },
        scale: {
          name: "Scale",
          tagline: "For high volume",
          price: "Custom",
          cta: "Contact Sales",
          features: ["VIP support", "Custom SLAs", "White-glove onboarding"],
        },
      },
    },
    faq: {
      title: "Frequently asked questions",
      subtitle: "Quick answers to common questions.",
      items: [
        {
          q: "Can I use my own domain?",
          a: "Yes. Connect a custom domain in settings after creating your store.",
        },
        {
          q: "What payment methods are supported?",
          a: "Major credit cards and wallets via leading gateways. Availability varies by region.",
        },
        {
          q: "Can I switch plans later?",
          a: "Absolutely. Upgrade or downgrade anytime from your billing page.",
        },
      ],
    },
    contact: {
      title: "Contact us",
      subtitle: "Have questions? We’d love to help you find the right plan.",
      form: {
        name: { label: "Name", placeholder: "Jane Doe" },
        email: { label: "Email", placeholder: "jane@example.com" },
        message: {
          label: "Message",
          placeholder: "Tell us a bit about your needs...",
        },
        submit: "Send message",
      },
    },
    footer: {
      links: {
        howItWorks: "How it works",
        benefits: "Benefits",
        pricing: "Pricing",
        faq: "FAQ",
        contact: "Contact",
      },
      copyright: "All rights reserved.",
    },
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
        segments: [null, "dashboard"],
        value: Paths.Dashboard,
        children: "Orders",
        icon: "packagePlus",
      },
      // {
      //   segments: ["stores"],
      //   value: Paths.DashboardStores,
      //   children: "Stores",
      //   icon: "store",
      // },
      // {
      //   segments: ["create-store"],
      //   value: Paths.DashboardCreateStore,
      //   children: "Create Store",
      //   icon: "store",
      // },
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
    orders: {
      order: {
        "order details": "Order Details",
        "order info": "Order Info",
        "order ID": "Order ID",
        date: "Date",
        status: "Status",
        "payment method": "Payment Method",
        total: "Total",
        customer: "Customer",
        name: "Name",
        phone: "Phone",
        address: "Address",
        street: "Street",
        city: "City",
        state: "State",
        country: "Country",
        postalCode: "Postal Code",
        coordinates: "Coordinates",
        latitude: "Latitude",
        longitude: "Longitude",
        "no customer info": "No customer information.",
        items: "Items",
        product: "Product",
        sku: "SKU",
        quantity: "Quantity",
        "no items": "No items.",
        summary: "Summary",
        "items total": "Items Total",
        shipping: "Shipping",
        discount: "Discount",
        payment: "Payment",
        method: "Method",
        amount: "Amount",
        "no payment info": "No payment info.",
        reference: "Reference",
        attributes: "attributes",
        "product details": "Product Details",
        "product cost": "Product Cost",
        "product status": "Product Status",
        "product images": "Product Images",
      },
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

    "store-id": {
      "main-nav": [
        {
          segments: [null],
          value: "/",
          children: "Dashboard",
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
      ] as NavItem[],

      overview: "Overview",
      "browse all overview, edit, and filter.":
        "Browse all overview, edit, and filter.",

      products: {
        products: "Products",
        "create, browse, edit, and filter all products easily.":
          "create, browse, edit, and filter all products easily.",
        "no products found": "No Products Found",
        "there are no products in this store.":
          "There are no products in this store.",
        product: {
          "product details": "Product Details",
          "product cost": "Product Cost",
          "product status": "Product Status",
          "product images": "Product Images",
          attributes: "attributes",
        },
      },
      orders: {
        orders: "Orders",
        "create, browse, edit, and filter all orders easily.":
          "create, browse, edit, and filter all orders easily.",

        order: {
          "order details": "order details",
          "order status": "order status",
        },
      },
    },
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

    // orders: {
    "your order was not created. please try again.":
      "your order was not created. Please try again.",
    "your order was not updated. please try again.":
      "your order was not updated. Please try again.",
    "your order was not deleted. please try again.":
      "your order was not deleted. Please try again.",
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
          admin: { label: "Admin" },
          user: { label: "User" },
          merchant: { label: "Merchant" },
        } satisfies Record<UserRole, { label: string }>,
      },
      name: { name: "Name" },
      image: { image: "Image" },
      phone: { phone: "Phone" },
      address: { address: "Address" },
      preferences: { preferences: "Preferences" },
    },

    stores: {
      id: { id: "Identifier" },
      createdAt: { created_at: "Created At" },
      updatedAt: { updated_at: "Updated At" },
      ownerId: { owner_id: "Ownder Identifier" },

      username: { username: "Username", ovvegames: "ovvegames" },
      name: { name: "Name", "ovve games": "Ovve Games" },
      logo: { logo: "Logo" },
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
      description: {
        description: "description",
        "description n fit": "Description & Fit",
      },
      images: { images: "images" },
      status: {
        status: "status",
        "select status...": "select status...",
        enums: {
          draft: { label: "Draft", color: "var(--chart-2)" },
          active: { label: "Active", color: "var(--chart-3)" },
          archived: { label: "Archived", color: "var(--chart-5)" },
        } satisfies Record<ProductStatus, { label: string; color: string }>,
      },

      price: { price: "price" },
      compareToPrice: { "compare to price": "compare to price" },
      cost: { cost: "cost" },

      attributes: { attributes: "attributes", size: "Size" },
    },
    orders: {
      id: { id: "ID" },
      createdAt: { createdAt: "Created At" },
      updatedAt: { updatedAt: "Updated At" },
      storeId: { storeId: "Store ID" },
      createdBy: { createdBy: "Created By" },
      userId: { userId: "User ID" },
      status: {
        status: "Status",
        "select status...": "select status...",
        enums: {
          pending: { label: "Pending", color: "var(--chart-2)" },
          paid: { label: "Paid", color: "var(--chart-3)" },
          fulfilled: { label: "Fulfilled", color: "var(--chart-4)" },
          cancelled: { label: "Cancelled", color: "var(--chart-5)" },
          refunded: { label: "Refunded", color: "var(--chart-6)" },
          failed: { label: "Failed", color: "var(--chart-7)" },
        } as const,
      },
      address: {
        name: { name: "Name" },
        phones: { phones: "Phones" },
        street: { street: "Street" },
        city: { city: "City" },
        state: { state: "State" },
        country: { country: "Country" },
        postalCode: { postalCode: "Postal Code" },
        coordinates: {
          latitude: "Latitude",
          longitude: "Longitude",
        },
      },

      items: { items: "Order Items" },
      expenses: {
        shipping: { shipping: "Shipping" },
        discount: { discount: "Discount" },
      },
      actions: {
        action: {
          "payment method": "Payment Method",
          "select payment method...": "select payment method...",
          enums: {
            paying__cod: { label: "Cash on Delivery", color: "var(--chart-2)" },
            paying__instapay: { label: "Instapay", color: "var(--chart-3)" },
          } as const,
        },
        status: {
          "payment status": "Payment Status",
          enums: {
            unpaid: { label: "Unpaid", color: "var(--chart-2)" },
            paid: { label: "Paid", color: "var(--chart-3)" },
            pending: { label: "Pending", color: "var(--chart-4)" },
            failed: { label: "Failed", color: "var(--chart-5)" },
            refunded: { label: "Refunded", color: "var(--chart-6)" },
          } as const,
        },
        amount: { amount: "Amount" },
        username: { username: "Username" },
      },

      notes: { notes: "Notes" },
    },
  },
  // Commom phrases
  cmn: {
    "are you absolutely sure?": "Are you absolutely sure?",
    "this action cannot be undone. this will permanently delete your account and remove your data from our servers.":
      "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",

    "created successfully.": "Created successfully.",
    "updated successfully.": "Updated successfully.",
    "deleted successfully.": "Deleted successfully.",
    "work with us": "Work with us",
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
    "message sent successfully": "Message sent successfully",
    "update data": "Update Data",
    "update preferences": "Update Preferences",
    all: "All",
    "check code": "Check Code",
    "next step": "Next step",
    "pre step": "Pre step",
    "continue to shipping": "Continue to shipping",
    "continue to payment": "Continue to payment",
    "continue to review": "Continue to review",
    back: "Back",
    discard: "Discard",
    preview: "Preview",
    "place order": "Place Order",
    "create product": "Create product",
    "create store": "Create store",
    "you maight also like:": "You maight also like:",
    choose: "Choose",
    varients: "Varients",
    "add to cart": "Add To Cart",
    login: "Login",
  },

  "mode-switcher": {
    theme: "Theme",
    "automatically switch between day and night themes.":
      "Automatically switch between day and night themes.",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  "data-table-row-actions": {
    actions: "Actions",
    "open menu": "Open Menu",
  },
  "product-attribute-form": {
    "no variants": "No Variants",
    "this is field for having multiple variants":
      "This is field for having multiple variants",
    "for customers to choose between.": "for customers to choose between.",
  },
};

export default en;
