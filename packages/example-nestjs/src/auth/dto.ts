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

export class ReceiptTokenResponse {
  @ApiProperty({ type: String })
  token!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;
}
