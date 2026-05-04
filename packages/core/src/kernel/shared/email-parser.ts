import {
  createEmailAddress,
  type EmailAddress,
} from "../domain/value-objects/index.js";
import { InvalidEmailError } from "../domain/errors/index.js";

export function parseEmail(input: string): EmailAddress {
  try {
    return createEmailAddress(input);
  } catch {
    throw new InvalidEmailError(`Invalid email: ${input}`);
  }
}
