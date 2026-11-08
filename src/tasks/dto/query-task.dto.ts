import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { TASK_STATUSES } from '../entities/task.entity.js';

export class QueryTaskDto {
  @IsOptional()
  @IsUUID('all', { message: 'projectId harus berupa UUID yang valid' })
  readonly projectId?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES, {
    message: `Status harus salah satu dari: ${TASK_STATUSES.join(', ')}`,
  })
  readonly status?: string;
}
