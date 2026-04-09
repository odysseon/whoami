import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";

@Module({
  controllers: [AuthController],
  // No providers needed!
})
export class AuthModule {}
