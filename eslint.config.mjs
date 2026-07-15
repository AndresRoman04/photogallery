import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

// Flat config for ESLint 10 / Next.js 16 (`next lint` no longer exists).
// components/ui/** is vendored shadcn boilerplate — not worth linting.
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // vendored shadcn boilerplate (components + its generated hooks)
      "components/ui/**",
      "hooks/use-mobile.ts",
      "hooks/use-toast.ts",
      // local Claude Code tooling, not app code
      ".claude/**",
      "next-env.d.ts",
    ],
  },
  {
    // Tests mock Prisma/session shapes with `as any` throughout — an
    // established convention here; strict typing of mocks adds noise, not
    // safety, since the real types are enforced in the code under test.
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // React Compiler-era rule that flags the classic fetch-on-mount pattern
    // (effect → async loader → setLoading(true)). The pattern is used by all
    // data-fetching components here; restructuring them is a separate effort,
    // so surface it as a warning rather than block the lint gate.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default config
