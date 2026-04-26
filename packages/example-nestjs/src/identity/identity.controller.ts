import { Controller, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentReceipt } from "@odysseon/whoami-adapter-nestjs";
import type { Receipt } from "@odysseon/whoami-core";
import { ProfileResponse } from "./dto.js";

@ApiTags("identity")
@ApiBearerAuth()
@Controller("me")
export class IdentityController {
  @Get()
  @ApiOperation({ summary: "Get authenticated account profile" })
  @ApiOkResponse({ type: ProfileResponse })
  @ApiUnauthorizedResponse({ description: "Missing or invalid receipt token" })
  getMe(@CurrentReceipt() receipt: Receipt): ProfileResponse {
    return {
      accountId: receipt.accountId,
      tokenExpiresAt: receipt.expiresAt,
    };
  }
}
