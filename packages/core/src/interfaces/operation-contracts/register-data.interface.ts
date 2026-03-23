/**
 * The strictly typed input required to register a new local identity.
 * Notice we do not include `id` here, as identity generation is the
 * responsibility of the core service or the database, not the incoming request.
 */
export interface IRegisterWithEmailData {
  email: string;
  password: string;
}
