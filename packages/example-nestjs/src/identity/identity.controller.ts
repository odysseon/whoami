import { Controller, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import {
  CurrentIdentity,
  type RequestIdentity,
} from "@odysseon/whoami-adapter-nestjs";
import { ProfileResponse } from "./dto.js";

@ApiTags("identity")
@ApiBearerAuth()
@Controller("me")
export class IdentityController {
  @Get()
  @ApiOperation({ summary: "Get authenticated account profile" })
  @ApiOkResponse({ type: ProfileResponse })
  @ApiUnauthorizedResponse({ description: "Missing or invalid receipt token" })
  getMe(@CurrentIdentity() identity: RequestIdentity): ProfileResponse {
    return identity;
  }
}
