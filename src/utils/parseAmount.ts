/**
 * Parses user-typed amount strings, tolerating comma thousand-separators
 * and stray whitespace (e.g. "1,000", "1 000.50", " 250 ").
 * Returns null if the result isn't a valid positive number.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '');
  if (cleaned === '') return null;

  const value = parseFloat(cleaned);
  if (isNaN(value) || value <= 0) return null;

  return value;
}