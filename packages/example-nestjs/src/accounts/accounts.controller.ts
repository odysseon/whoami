import {
  Body,
  Controller,
  Inject,
  Post,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiConflictResponse,
} from "@nestjs/swagger";
import { Public, AUTH_METHODS } from "@odysseon/whoami-adapter-nestjs";
import type { AuthMethods } from "@odysseon/whoami-core";
import { RegisterDto, RegisterResponse } from "./dto.js";

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(@Inject(AUTH_METHODS) private readonly auth: AuthMethods) {}

  @ApiOperation({ summary: "Register a new account" })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: RegisterResponse })
  @ApiConflictResponse({ description: "Email already registered" })
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    const receipt = await this.auth.registerWithPassword!({
      email: dto.email,
      password: dto.password,
    });
    return { token: receipt.token, expiresAt: receipt.expiresAt };
  }
}
