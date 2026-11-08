import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { TaskAssignmentsService } from './task_assignments.service.js';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto.js';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto.js';

@Controller('task-assignments')
export class TaskAssignmentsController {
  constructor(private readonly taskAssignmentsService: TaskAssignmentsService) {}

  @Get()
  findAll() {
    return this.taskAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskAssignmentsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateTaskAssignmentDto) {
    return this.taskAssignmentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskAssignmentDto) {
    return this.taskAssignmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskAssignmentsService.remove(id);
  }
}
