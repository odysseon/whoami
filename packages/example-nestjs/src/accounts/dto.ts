import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ type: String, example: "ada@example.com", format: "email" })
  email!: string;

  @ApiProperty({ type: String, example: "secret123", minLength: 8 })
  password!: string;
}

export class RegisterResponse {
  @ApiProperty({ type: String, example: "eyJhbGciOiJIUzI1NiJ9..." })
  token!: string;

  @ApiProperty({ type: Date, format: "date-time" })
  expiresAt!: Date;
}
