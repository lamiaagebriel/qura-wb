import { SelectItem } from "@/types";

export default {
  site: {
    name: "concom",
    description:
      "Our platform offers advanced social media automation services using cutting-edge AI technology. We assist clients in executing fully integrated marketing campaigns tailored specifically for real estate projects. Through data analysis and market forecasting, we provide innovative solutions that enhance targeting, increase content engagement, and boost the performance of marketing campaigns. Our goal is to empower clients to reach their target audience more efficiently, increase real estate sales strategically, while reducing costs and accelerating the achievement of results.",
  },
  auth: {
    login: {
      meta: { title: "Login" },
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "Alex Thompson, CEO of Thompson Real Estate",
      "don't have an account? sign up now":
        "Don't have an account? Sign Up now",
      "or continue with": "or continue with",
      "sign in with email": "Sign In with Email",
      "sign in with google": "Sign In with Google",
      "forgot password": "Forgot Password?",
    },
    register: {
      meta: { title: "Register" },
      "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.":
        "since collaborating with Deal Ai, our property sales have surged by 40%, and client satisfaction has reached new heights. their platform has optimized our operations, driving significant business growth.",
      "Alex Thompson, CEO of Thompson Real Estate":
        "Alex Thompson, CEO of Thompson Real Estate",
      "already have an account? sign in.": "Already have an account? Sign In.",
      "or continue with": "or continue with",
      "sign up with email": "Sign Up with Email",
      "sign up with google": "Sign Up with Google",
    },
  },

  "locale-switcher": {
    "current locale of the website": "current locale of the website",
    en: "English (EN)",
    ar: "العربية (AR)",
    fr: "French (FR)",
    de: "Deautch (DE)",
  },
  "mode-toggle": {
    "toggle theme": "toggle theme",
    modes: [
      { value: "light", label: "Light", icon: "sun" },
      { value: "dark", label: "Dark", icon: "moon" },
      { value: "system", label: "System", icon: "laptop" },
    ] as SelectItem[],
  },
  "user-form": {
    name: {
      "full name": "Full Name",
      "joe doe": "Joe Doe",
    },
    email: { email: "Email" },
    password: { password: "Password" },
  },
};
