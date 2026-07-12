import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Conventions SweeLeads : tout est typé, aucune échappatoire `any`.
      '@typescript-eslint/no-explicit-any': 'error',
      // Les hooks maison useAsync/useAsyncEvent lancent volontairement le fetch
      // au montage : on assume le pattern (convention SweeBadge).
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // Composants shadcn : ils réexportent des variantes (buttonVariants…) à côté
    // du composant, ce qui est le pattern officiel shadcn.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
