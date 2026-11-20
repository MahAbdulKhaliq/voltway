import { configDefaults, defineConfig } from 'vitest/config';

// Parallel Claude sessions keep git worktrees under .claude/worktrees; their copies of the
// tests must not run as part of this checkout's suite.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
    // The real-data tests build all ~1,400 cars (Phase 9 waves 2-3), which takes longer than the 5 s default.
    testTimeout: 30000,
  },
});
