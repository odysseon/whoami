import { Logger } from "@nestjs/common";
import type { ILogger } from "@odysseon/whoami-core";

export class NestLoggerAdapter extends Logger implements ILogger {
  public info(message: unknown, ...optionalParams: unknown[]): void {
    this.log(message as string, ...optionalParams);
  }

  public warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams);
  }

  public error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);
  }

  public debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(message, ...optionalParams);
  }
}
