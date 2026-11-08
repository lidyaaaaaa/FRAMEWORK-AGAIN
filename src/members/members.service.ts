import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Member } from './entities/member.entity.js';
import { Team } from '../teams/entities/team.entity.js';
import { CreateMemberDto } from './dto/create-members-dto.js';
import { UpdateMemberDto } from './dto/update-members-dto.js';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
  ) {}

  findAll(): Promise<Member[]> {
    return this.membersRepository.find({ relations: { team: true } });
  }

  async findById(id: string): Promise<Member> {
    const member = await this.membersRepository.findOne({
      where: { id },
      relations: { team: true, assignments: { task: true } },
    });
    if (!member) throw new NotFoundException(`Member dengan id ${id} tidak ditemukan`);
    return member;
  }

  private async ensureTeamExists(teamId: string): Promise<void> {
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException(`Tim dengan id ${teamId} tidak ditemukan`);
  }

  async create(input: CreateMemberDto): Promise<Member> {
    const existing = await this.membersRepository.findOne({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException(`Email ${input.email} sudah terdaftar`);

    const { teamId, ...rest } = input;
    if (teamId) await this.ensureTeamExists(teamId);

    const member = this.membersRepository.create({
      ...rest,
      team: teamId ? { id: teamId } : null,
    });
    return this.membersRepository.save(member);
  }

  async update(id: string, input: UpdateMemberDto): Promise<Member> {
    const member = await this.findById(id);

    if (input.email && input.email !== member.email) {
      const existing = await this.membersRepository.findOne({
        where: { email: input.email, id: Not(id) },
      });
      if (existing) throw new ConflictException(`Email ${input.email} sudah digunakan`);
    }

    const { teamId, ...rest } = input;
    Object.assign(member, rest);

    if (teamId !== undefined) {
      await this.ensureTeamExists(teamId);
      member.team = { id: teamId } as Team;
    }

    return this.membersRepository.save(member);
  }

  async remove(id: string): Promise<boolean> {
    const member = await this.findById(id);
    await this.membersRepository.remove(member);
    return true;
  }
}
