import { IsIn, IsNotEmpty } from 'class-validator';
import { ASSIGNMENT_ROLES } from '../entities/task_assignment.entity.js';

export class UpdateTaskAssignmentDto {
  @IsNotEmpty({ message: 'Peran wajib diisi' })
  @IsIn(ASSIGNMENT_ROLES, {
    message: `Peran harus salah satu dari: ${ASSIGNMENT_ROLES.join(', ')}`,
  })
  readonly role: string;
}
