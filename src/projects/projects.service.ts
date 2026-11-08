import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { Team } from '../teams/entities/team.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.projectsRepository.find({ relations: { team: true } });
  }

  async findById(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: { team: true, tasks: true },
    });
    if (!project) throw new NotFoundException(`Proyek dengan id ${id} tidak ditemukan`);
    return project;
  }

  // aturan bisnis: tanggal selesai tidak boleh lebih awal dari tanggal mulai
  private validateDates(startDate?: string | null, endDate?: string | null): void {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException('Tanggal selesai tidak boleh lebih awal dari tanggal mulai');
    }
  }

  private async ensureTeamExists(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException(`Tim dengan id ${teamId} tidak ditemukan`);
  }

  async create(input: CreateProjectDto): Promise<Project> {
    this.validateDates(input.startDate, input.endDate);

    const { teamId, ...rest } = input;
    await this.ensureTeamExists(teamId);

    const project = this.projectsRepository.create({
      ...rest,
      team: { id: teamId },
    });
    return this.projectsRepository.save(project);
  }

  async update(id: string, input: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id);

    this.validateDates(input.startDate ?? project.startDate, input.endDate ?? project.endDate);

    const { teamId, ...rest } = input;
    Object.assign(project, rest);

    if (teamId !== undefined) {
      await this.ensureTeamExists(teamId);
      project.team = { id: teamId } as Team;
    }

    return this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<boolean> {
    const project = await this.findById(id);
    // tugas dan penugasan ikut terhapus lewat ON DELETE CASCADE
    await this.projectsRepository.remove(project);
    return true;
  }
}
