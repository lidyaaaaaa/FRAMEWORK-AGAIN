import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty({ message: 'Nama tim wajib diisi' })
  @IsString({ message: 'Nama tim harus berupa teks' })
  @MaxLength(100, { message: 'Nama tim maksimal 100 karakter' })
  readonly name: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  readonly description?: string;
}
