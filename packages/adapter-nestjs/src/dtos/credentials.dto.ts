import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import type {
  IEmailPasswordCredentials,
  IOAuthCredentials,
} from "@odysseon/whoami-core";

export class EmailPasswordDto implements IEmailPasswordCredentials {
  @IsEmail({}, { message: "A valid email is required." })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Password cannot be empty." })
  password!: string;
}

export class OAuthDto implements IOAuthCredentials {
  @IsString()
  @IsNotEmpty({ message: "Provider (e.g., google, github) is required." })
  provider!: string;

  @IsString()
  @IsNotEmpty({ message: "Provider ID is required." })
  providerId!: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: "Refresh token is required." })
  refreshToken!: string;
}
