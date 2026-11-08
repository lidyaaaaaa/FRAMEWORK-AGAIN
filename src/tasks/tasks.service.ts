import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';

// aturan bisnis: alur perpindahan status tugas yang diperbolehkan
// todo -> in_progress -> review -> done (boleh mundur satu langkah, done dapat dibuka kembali)
const STATUS_TRANSITIONS: Record<string, string[]> = {
  todo: ['in_progress'],
  in_progress: ['todo', 'review'],
  review: ['in_progress', 'done'],
  done: ['in_progress'],
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  findAll(query: QueryTaskDto): Promise<Task[]> {
    const where: FindOptionsWhere<Task> = {};
    if (query.projectId) where.project = { id: query.projectId };
    if (query.status) where.status = query.status;

    return this.tasksRepository.find({
      where,
      relations: { project: true, assignments: { member: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: { project: { team: true }, assignments: { member: true } },
    });
    if (!task) throw new NotFoundException(`Tugas dengan id ${id} tidak ditemukan`);
    return task;
  }

  // aturan bisnis: tenggat waktu tidak boleh sebelum hari ini
  private validateDueDate(dueDate?: string): void {
    if (!dueDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(dueDate) < today) {
      throw new BadRequestException('Tenggat waktu tidak boleh sebelum hari ini');
    }
  }

  async create(input: CreateTaskDto): Promise<Task> {
    this.validateDueDate(input.dueDate);

    const { projectId, ...rest } = input;
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Proyek dengan id ${projectId} tidak ditemukan`);

    // aturan bisnis: proyek yang sudah selesai/diarsipkan tidak menerima tugas baru
    if (project.status === 'completed' || project.status === 'archived') {
      throw new BadRequestException(`Proyek berstatus "${project.status}" tidak dapat menerima tugas baru`);
    }

    const task = this.tasksRepository.create({
      ...rest,
      status: 'todo',
      project: { id: projectId },
    });
    const saved = await this.tasksRepository.save(task);
    return this.findById(saved.id);
  }

  async update(id: string, input: UpdateTaskDto): Promise<Task> {
    const task = await this.findById(id);
    this.validateDueDate(input.dueDate);

    Object.assign(task, input);
    await this.tasksRepository.save(task);
    return this.findById(id);
  }

  async updateStatus(id: string, input: UpdateTaskStatusDto): Promise<Task> {
    const task = await this.findById(id);

    if (task.status === input.status) {
      throw new BadRequestException(`Tugas sudah berstatus "${task.status}"`);
    }

    const allowed = STATUS_TRANSITIONS[task.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new BadRequestException(
        `Status tidak dapat diubah dari "${task.status}" ke "${input.status}". Status yang diperbolehkan: ${allowed.join(', ')}`,
      );
    }

    // aturan bisnis: tugas tanpa penugasan tidak dapat dikerjakan
    if (task.status === 'todo' && input.status === 'in_progress' && task.assignments.length === 0) {
      throw new BadRequestException('Tugas harus ditugaskan ke minimal satu anggota sebelum dikerjakan');
    }

    task.status = input.status;
    task.completedAt = input.status === 'done' ? new Date() : null;
    await this.tasksRepository.save(task);
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    const task = await this.findById(id);
    // penugasan ikut terhapus lewat ON DELETE CASCADE
    await this.tasksRepository.remove(task);
    return true;
  }
}
