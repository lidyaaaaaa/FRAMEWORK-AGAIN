import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskAssignment } from './entities/task_assignment.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Member } from '../members/entities/member.entity.js';
import { TaskAssignmentsController } from './task_assignments.controller.js';
import { TaskAssignmentsService } from './task_assignments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskAssignment, Task, Member])],
  controllers: [TaskAssignmentsController],
  providers: [TaskAssignmentsService],
  exports: [TaskAssignmentsService, TypeOrmModule],
})
export class TaskAssignmentsModule {}
