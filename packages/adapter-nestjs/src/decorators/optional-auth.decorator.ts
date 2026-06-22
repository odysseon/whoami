import { CustomDecorator, SetMetadata } from "@nestjs/common";

export const IS_OPTIONAL_AUTH_KEY = Symbol("whoami:optional_auth");
export const OptionalAuth = (): CustomDecorator<symbol> =>
  SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
