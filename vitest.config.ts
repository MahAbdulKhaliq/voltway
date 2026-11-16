import { configDefaults, defineConfig } from 'vitest/config';

// Parallel Claude sessions keep git worktrees under .claude/worktrees; their copies of the
// tests must not run as part of this checkout's suite.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
