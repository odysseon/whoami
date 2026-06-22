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
  OptionalAuth,
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

  @Get("optional")
  @OptionalAuth()
  @ApiOperation({ summary: "Get account profile optionally" })
  @ApiOkResponse({
    type: ProfileResponse,
    description: "Returns identity if authenticated, otherwise null",
  })
  getOptionalMe(
    @CurrentIdentity({ required: false }) identity?: RequestIdentity,
  ): ProfileResponse | null {
    return identity ?? null;
  }
}
