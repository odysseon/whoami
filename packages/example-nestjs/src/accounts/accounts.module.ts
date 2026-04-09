import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller.js";

@Module({
  controllers: [AccountsController],
  // No providers needed! WhoamiModule provides everything globally
})
export class AccountsModule {}
