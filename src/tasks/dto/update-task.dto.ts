import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TASK_PRIORITIES } from '../entities/task.entity.js';

// status tidak diubah lewat endpoint ini, gunakan PATCH /tasks/:id/status
export class UpdateTaskDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Judul tugas tidak boleh kosong' })
  @IsString({ message: 'Judul tugas harus berupa teks' })
  @MaxLength(150, { message: 'Judul tugas maksimal 150 karakter' })
  readonly title?: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa teks' })
  readonly description?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES, {
    message: `Prioritas harus salah satu dari: ${TASK_PRIORITIES.join(', ')}`,
  })
  readonly priority?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Tenggat waktu harus berformat YYYY-MM-DD' })
  readonly dueDate?: string;
}
