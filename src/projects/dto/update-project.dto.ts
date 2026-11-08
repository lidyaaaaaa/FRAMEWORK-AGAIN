import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PROJECT_STATUSES } from '../entities/project.entity.js';

export class UpdateProjectDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Nama proyek tidak boleh kosong' })
  @IsString({ message: 'Nama proyek harus berupa teks' })
  @MaxLength(150, { message: 'Nama proyek maksimal 150 karakter' })
  readonly name?: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  readonly description?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES, {
    message: `Status proyek harus salah satu dari: ${PROJECT_STATUSES.join(', ')}`,
  })
  readonly status?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Tanggal mulai harus berformat YYYY-MM-DD' })
  readonly startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Tanggal selesai harus berformat YYYY-MM-DD' })
  readonly endDate?: string;

  @IsOptional()
  @IsUUID('all', { message: 'teamId harus berupa UUID yang valid' })
  readonly teamId?: string;
}
