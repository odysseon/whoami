import { ApiProperty } from "@nestjs/swagger";

export class LoginPasswordDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "secret123", minLength: 8 })
  password!: string;
}

export class OAuthLoginDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "google" })
  provider!: string;

  @ApiProperty({ type: String, example: "1234567890" })
  providerId!: string;
}

export class MagicLinkRequestDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;
}

export class MagicLinkVerifyDto {
  @ApiProperty({ type: String, example: "magic-link-token-here" })
  token!: string;
}

export class ReceiptTokenResponse {
  @ApiProperty({ type: String })
  token!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;
}

export class MagicLinkRequestResponse {
  @ApiProperty({ type: String, example: "Magic link issued." })
  message!: string;

  @ApiProperty({ type: String, example: "magic-link-token-here" })
  magicLinkToken!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;

  @ApiProperty({ type: Boolean, example: true })
  isNewAccount!: boolean;

  @ApiProperty({
    type: String,
    example: "demo only — never expose tokens in production",
  })
  note!: string;
}
