// Name helpers for the importers.

/** `words` without the first contiguous run equal to `run` (case-insensitive); unchanged if absent. */
export function dropRun(words: string[], run: string[]): string[] {
  if (!run.length) return words;
  const low = (x: string) => x.toLowerCase();
  for (let i = 0; i + run.length <= words.length; i++) {
    if (run.every((w, j) => low(words[i + j]) === low(w))) return [...words.slice(0, i), ...words.slice(i + run.length)];
  }
  return words;
}
