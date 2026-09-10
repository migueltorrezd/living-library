import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // react-three-fiber drives the scene by mutating three.js objects inside
    // useFrame, 60 times a second. Rebuilding uniform objects per frame would
    // recompile materials, so the compiler's immutability rule is turned off
    // for the render layer only.
    files: ["src/components/**", "src/lib/**"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Unmodified third-party worker copied from the pinned pdfjs-dist package.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/reading/pdf.worker.min.mjs"]),
]);

export default eslintConfig;
