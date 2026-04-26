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
import { Public, moduleToken } from "@odysseon/whoami-adapter-nestjs";
import type { PasswordMethods } from "@odysseon/whoami-core";
import { RegisterDto, RegisterResponse } from "./dto.js";

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(
    @Inject(moduleToken("password"))
    private readonly password: PasswordMethods,
  ) {}

  @ApiOperation({ summary: "Register a new account" })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: RegisterResponse })
  @ApiConflictResponse({ description: "Email already registered" })
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    const { account } = await this.password.registerWithPassword({
      email: dto.email,
      password: dto.password,
    });
    return {
      accountId: account.id,
      email: account.email,
      createdAt: account.createdAt,
    };
  }
}
