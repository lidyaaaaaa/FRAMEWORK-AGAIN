import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Team } from './entities/team.entity.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
  ) {}

  findAll(): Promise<Team[]> {
    return this.teamsRepository.find({ relations: { members: true, projects: true } });
  }

  async findById(id: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: { members: true, projects: true },
    });
    if (!team) throw new NotFoundException(`Tim dengan id ${id} tidak ditemukan`);
    return team;
  }

  async create(input: CreateTeamDto): Promise<Team> {
    const existing = await this.teamsRepository.findOne({
      where: { name: input.name },
    });
    if (existing) throw new ConflictException(`Tim "${input.name}" sudah terdaftar`);

    const team = this.teamsRepository.create(input);
    return this.teamsRepository.save(team);
  }

  async update(id: string, input: UpdateTeamDto): Promise<Team> {
    const team = await this.findById(id);

    if (input.name) {
      const existing = await this.teamsRepository.findOne({
        where: { name: input.name, id: Not(id) },
      });
      if (existing) throw new ConflictException(`Tim "${input.name}" sudah terdaftar`);
    }

    Object.assign(team, input);
    return this.teamsRepository.save(team);
  }

  async remove(id: string): Promise<boolean> {
    const team = await this.findById(id);
    // aturan bisnis: tim yang masih memiliki proyek tidak boleh dihapus
    if (team.projects.length > 0) {
      throw new ConflictException(
        `Tim "${team.name}" masih memiliki ${team.projects.length} proyek, hapus proyeknya terlebih dahulu`,
      );
    }
    await this.teamsRepository.remove(team);
    return true;
  }
}
