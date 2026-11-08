import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Nama tim tidak boleh kosong' })
  @IsString({ message: 'Nama tim harus berupa teks' })
  @MaxLength(100, { message: 'Nama tim maksimal 100 karakter' })
  readonly name?: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  readonly description?: string;
}
