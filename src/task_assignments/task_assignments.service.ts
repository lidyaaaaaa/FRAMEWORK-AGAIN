import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TaskAssignment } from './entities/task_assignment.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Member } from '../members/entities/member.entity.js';
import { CreateTaskAssignmentDto } from './dto/create-task-assignment.dto.js';
import { UpdateTaskAssignmentDto } from './dto/update-task-assignment.dto.js';

@Injectable()
export class TaskAssignmentsService {
  constructor(
    @InjectRepository(TaskAssignment)
    private readonly assignmentsRepository: Repository<TaskAssignment>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<TaskAssignment[]> {
    return this.assignmentsRepository.find({ relations: { task: true, member: true } });
  }

  async findById(id: string): Promise<TaskAssignment> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: { task: true, member: true },
    });
    if (!assignment) throw new NotFoundException(`Penugasan dengan id ${id} tidak ditemukan`);
    return assignment;
  }

  async create(input: CreateTaskAssignmentDto): Promise<TaskAssignment[]> {
    const task = await this.tasksRepository.findOne({
      where: { id: input.taskId },
      relations: { project: { team: true } },
    });
    if (!task) throw new NotFoundException(`Tugas dengan id ${input.taskId} tidak ditemukan`);

    // aturan bisnis: tugas yang sudah selesai tidak dapat ditugaskan lagi
    if (task.status === 'done') {
      throw new BadRequestException('Tugas yang sudah berstatus "done" tidak dapat ditugaskan');
    }

    const members = await this.membersRepository.find({
      where: { id: In(input.memberIds) },
      relations: { team: true },
    });
    const foundIds = members.map((member) => member.id);
    const missing = input.memberIds.filter((id) => !foundIds.includes(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Member dengan id ${missing.join(', ')} tidak ditemukan`);
    }

    // aturan bisnis: hanya anggota dari tim pemilik proyek yang boleh ditugaskan
    const outsiders = members.filter((member) => member.team?.id !== task.project.team.id);
    if (outsiders.length > 0) {
      throw new BadRequestException(
        `Member ${outsiders.map((member) => member.name).join(', ')} bukan anggota tim "${task.project.team.name}"`,
      );
    }

    // aturan bisnis: satu anggota hanya boleh ditugaskan satu kali pada tugas yang sama
    const existing = await this.assignmentsRepository.find({
      where: { task: { id: task.id }, member: { id: In(input.memberIds) } },
      relations: { member: true },
    });
    if (existing.length > 0) {
      throw new ConflictException(
        `Member ${existing.map((item) => item.member.name).join(', ')} sudah ditugaskan pada tugas ini`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const assignmentRepo = manager.getRepository(TaskAssignment);
      const saved: TaskAssignment[] = [];

      for (const memberId of input.memberIds) {
        const assignment = assignmentRepo.create({
          task: { id: task.id },
          member: { id: memberId },
          role: input.role ?? 'assignee',
        });
        saved.push(await assignmentRepo.save(assignment));
      }

      return assignmentRepo.find({
        where: { id: In(saved.map((item) => item.id)) },
        relations: { task: true, member: true },
      });
    });
  }

  async update(id: string, input: UpdateTaskAssignmentDto): Promise<TaskAssignment> {
    const assignment = await this.findById(id);
    assignment.role = input.role;
    return this.assignmentsRepository.save(assignment);
  }

  async remove(id: string): Promise<boolean> {
    const assignment = await this.findById(id);

    // aturan bisnis: tugas yang sedang dikerjakan harus tetap punya minimal satu penugasan
    if (assignment.task.status === 'in_progress' || assignment.task.status === 'review') {
      const total = await this.assignmentsRepository.count({
        where: { task: { id: assignment.task.id } },
      });
      if (total <= 1) {
        throw new BadRequestException(
          `Penugasan terakhir pada tugas berstatus "${assignment.task.status}" tidak dapat dilepas. Kembalikan status ke "todo" terlebih dahulu`,
        );
      }
    }

    await this.assignmentsRepository.remove(assignment);
    return true;
  }
}
