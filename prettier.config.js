/** @type {import('prettier').Config} */

module.exports = {
  endOfLine: "lf",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "es5",
  plugins: [
    //     "@ianvs/prettier-plugin-sort-imports",
    //     "editor.formatOnSave": true,
    //  "editor.codeActionsOnSave": {
    //    "source.fixAll": true,
    //    "source.organizeImports": true,
    //    "source.sortMembers": true
    //  },
    "prettier-plugin-organize-imports",
    "prettier-plugin-tailwindcss",
  ],
  tailwindFunctions: ["cn", "cva"],
  importOrder: [
    "^(next/(.*)$)|^(next$)",
    "^(react/(.*)$)|^(react$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/lib/(.*)$",
    "^@/hooks/(.*)$",
    "^@/types/(.*)$",
    "^@/styles/(.*)$",
    "^@/app/(.*)$",
    "^@/components/ui/(.*)$",
    "^@/components/(.*)$",
    "",
    "^[./]",
  ],
  // importOrderSeparation: false,
  // importOrderSortSpecifiers: true,
  // importOrderBuiltinModulesToTop: true,
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  // importOrderMergeDuplicateImports: true,
  // importOrderCombineTypeAndValueImports: true,
};
