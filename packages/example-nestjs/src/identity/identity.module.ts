import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { WhoamiAuthGuard } from "@odysseon/whoami-adapter-nestjs";
import { IdentityController } from "./identity.controller.js";

@Module({
  controllers: [IdentityController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: WhoamiAuthGuard,
    },
  ],
})
export class IdentityModule {}
