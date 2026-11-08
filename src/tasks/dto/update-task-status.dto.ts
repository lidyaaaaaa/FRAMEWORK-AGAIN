import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { TASK_STATUSES } from '../entities/task.entity.js';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(TASK_STATUSES, {
    message: `Status harus salah satu dari: ${TASK_STATUSES.join(', ')}`,
  })
  status: string;
}
