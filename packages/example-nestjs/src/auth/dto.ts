import { ApiProperty } from "@nestjs/swagger";

export class LoginPasswordDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "secret123" })
  password!: string;
}

export class OAuthLoginDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "google" })
  provider!: string;

  @ApiProperty({ type: String, example: "g-12345" })
  providerId!: string;
}

export class ReceiptTokenResponse {
  @ApiProperty({ type: String, example: "eyJhbGciOiJIUzI1NiJ9..." })
  token!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;
}
