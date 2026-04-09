import { ApiProperty } from "@nestjs/swagger";

export class ProfileResponse {
  @ApiProperty({ type: String, example: "123" })
  accountId!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  tokenExpiresAt!: Date;
}
