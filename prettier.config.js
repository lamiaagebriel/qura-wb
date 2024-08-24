/** @type {import('prettier').Config} */

module.exports = {
  endOfLine: "lf",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
  importOrder: [
    "^(next/(.*)$)|^(next$)",
    "^(react/(.*)$)|^(react$)",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^@/types/(.*)$",
    "^@/styles/(.*)$",
    "^@/app/(.*)$",
    "",
    "^@/components/ui/(.*)$",
    "^@/components/(.*)$",
    "",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
};
