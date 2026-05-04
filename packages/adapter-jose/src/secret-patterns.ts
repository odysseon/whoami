const SEQUENTIAL_THRESHOLD = 8;
const KEYBOARD_WALKS = ["qwerty", "asdfgh", "zxcvbn", "password"];
const DIGIT_MAJORITY_THRESHOLD = 0.5;

function hasRepeatedPattern(secret: string): boolean {
  if (new Set(secret).size === 1) return true;

  for (let period = 1; period <= secret.length / 2; period++) {
    if (secret.length % period !== 0) continue;
    if (secret.slice(0, period).repeat(secret.length / period) === secret)
      return true;
  }

  return false;
}

function hasLongSequence(secret: string, step: 1 | -1): boolean {
  let run = 1;
  for (let i = 1; i < secret.length; i++) {
    if (secret.charCodeAt(i) === secret.charCodeAt(i - 1) + step) {
      if (++run >= SEQUENTIAL_THRESHOLD) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

function hasKeyboardWalkOrCommonWord(secret: string): boolean {
  const lower = secret.toLowerCase();
  for (const walk of KEYBOARD_WALKS) {
    if (lower.includes(walk)) return true;
  }
  return false;
}

function hasDigitSequenceAbuse(secret: string): boolean {
  const lower = secret.toLowerCase();
  if (!lower.includes("123456")) return false;
  if (lower.includes("1234567890")) return true;

  let digitCount = 0;
  for (let i = 0; i < lower.length; i++) {
    const code = lower.charCodeAt(i);
    if (code >= 48 && code <= 57) digitCount++;
  }
  return digitCount > secret.length * DIGIT_MAJORITY_THRESHOLD;
}

export function hasWeakPattern(secret: string): boolean {
  return (
    hasRepeatedPattern(secret) ||
    hasLongSequence(secret, 1) ||
    hasLongSequence(secret, -1) ||
    hasKeyboardWalkOrCommonWord(secret) ||
    hasDigitSequenceAbuse(secret)
  );
}
