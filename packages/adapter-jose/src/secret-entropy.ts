/**
 * Estimates the total Shannon entropy of a string in bits.
 *
 * Computed as H(X) * len, where H(X) = -Σ p(c) * log2(p(c)) over all
 * distinct characters c. This gives total information content rather than
 * per-character entropy, making it length-sensitive.
 */
export function estimateEntropy(input: string): number {
  const len = input.length;
  if (len === 0) return 0;

  const freq = new Map<string, number>();
  for (const char of input) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }

  let entropyPerChar = 0;
  for (const count of freq.values()) {
    const p = count / len;
    entropyPerChar -= p * Math.log2(p);
  }

  return entropyPerChar * len;
}
