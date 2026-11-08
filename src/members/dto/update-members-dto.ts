import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  @IsString({ message: 'Nama harus berupa teks' })
  @MaxLength(150, { message: 'Nama maksimal 150 karakter' })
  readonly name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(150, { message: 'Email maksimal 150 karakter' })
  readonly email?: string;

  @IsOptional()
  @Matches(/^\d{10,15}$/, { message: 'Nomor telepon harus berupa 10-15 digit angka' })
  readonly phone?: string;

  @IsOptional()
  @IsString({ message: 'Posisi harus berupa teks' })
  @MaxLength(100, { message: 'Posisi maksimal 100 karakter' })
  readonly position?: string;

  @IsOptional()
  @IsUUID('all', { message: 'teamId harus berupa UUID yang valid' })
  readonly teamId?: string;
}
