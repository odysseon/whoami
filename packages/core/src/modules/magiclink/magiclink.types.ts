import type { MagicLinkMethods } from "./magiclink.methods.js";

export type RequestMagicLinkInput = Parameters<
  MagicLinkMethods["requestMagicLink"]
>[0];
export type RequestMagicLinkOutput = Awaited<
  ReturnType<MagicLinkMethods["requestMagicLink"]>
>;

export type AuthenticateWithMagicLinkInput = Parameters<
  MagicLinkMethods["authenticateWithMagicLink"]
>[0];
export type AuthenticateWithMagicLinkOutput = Awaited<
  ReturnType<MagicLinkMethods["authenticateWithMagicLink"]>
>;
