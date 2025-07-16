import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Fix TypeScript import issues
      "@typescript-eslint/no-require-imports": "off",
      
      // Handle unused variables more gracefully
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_|^(claimStatus|systemStatus|uploadProgress|previewState)$", // Added common state vars
          "ignoreRestSiblings": true,
          "destructuredArrayIgnorePattern": "^_" // Also ignore destructured arrays starting with _
        }
      ],
      
      // Allow require() in .js files for scripts
      "no-undef": "off",
      
      // Disable some strict rules that might cause issues
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Allow console.log in scripts and development
      "no-console": "off"
    }
  },
  {
    // Specific rules for script files
    files: ["scripts/**/*.js", "scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "@typescript-eslint/no-var-requires": "off"
    }
  }
];

export default eslintConfig;