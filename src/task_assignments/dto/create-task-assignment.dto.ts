import { ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ASSIGNMENT_ROLES } from '../entities/task_assignment.entity.js';

export class CreateTaskAssignmentDto {
  @IsUUID('all', { message: 'taskId harus berupa UUID yang valid' })
  readonly taskId: string;

  // satu tugas dapat ditugaskan ke satu atau beberapa anggota sekaligus
  @IsArray({ message: 'memberIds harus berupa array' })
  @ArrayNotEmpty({ message: 'memberIds minimal berisi satu anggota' })
  @ArrayUnique({ message: 'memberIds tidak boleh berisi anggota yang sama' })
  @IsUUID('all', { each: true, message: 'Setiap memberIds harus berupa UUID yang valid' })
  readonly memberIds: string[];

  @IsOptional()
  @IsIn(ASSIGNMENT_ROLES, {
    message: `Peran harus salah satu dari: ${ASSIGNMENT_ROLES.join(', ')}`,
  })
  readonly role?: string;
}
