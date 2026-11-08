import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from './entities/member.entity.js';
import { Team } from '../teams/entities/team.entity.js';
import { MembersService } from './members.service.js';

describe('MembersService', () => {
  let service: MembersService;
  const membersRepo = { find: vi.fn(), findOne: vi.fn(), create: vi.fn(), save: vi.fn(), remove: vi.fn() };
  const teamsRepo = { findOne: vi.fn() };

  const makeMember = (assignments: { task: { status: string } }[] = [], teamId: string | null = 'team1') => ({
    id: 'm1',
    name: 'Budi',
    email: 'budi@mail.com',
    team: teamId ? { id: teamId } : null,
    assignments,
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    membersRepo.save.mockImplementation((m) => Promise.resolve(m));
    const moduleRef = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        { provide: getRepositoryToken(Team), useValue: teamsRepo },
      ],
    }).compile();
    service = moduleRef.get(MembersService);
  });

  it('menolak email yang sudah terdaftar (409)', async () => {
    membersRepo.findOne.mockResolvedValue(makeMember());
    await expect(service.create({ name: 'X', email: 'budi@mail.com' })).rejects.toThrow(ConflictException);
  });

  it('menolak pembuatan member dengan tim yang tidak ada', async () => {
    membersRepo.findOne.mockResolvedValue(null);
    teamsRepo.findOne.mockResolvedValue(null);
    await expect(service.create({ name: 'X', email: 'x@mail.com', teamId: 'nope' })).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('update teamId', () => {
    it('mengeluarkan member dari tim saat teamId null', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([]));
      const result = await service.update('m1', { teamId: null });
      expect(result.team).toBeNull();
      expect(teamsRepo.findOne).not.toHaveBeenCalled();
    });

    it('memindahkan member ke tim lain bila tidak ada tugas aktif', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([{ task: { status: 'done' } }]));
      teamsRepo.findOne.mockResolvedValue({ id: 'team2' });
      const result = await service.update('m1', { teamId: 'team2' });
      expect(result.team).toEqual({ id: 'team2' });
    });

    it('menolak pindah tim bila masih punya tugas aktif', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([{ task: { status: 'in_progress' } }]));
      await expect(service.update('m1', { teamId: 'team2' })).rejects.toThrow(ConflictException);
      expect(membersRepo.save).not.toHaveBeenCalled();
    });

    it('tidak memeriksa tugas aktif bila tim tidak berubah', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([{ task: { status: 'todo' } }]));
      await expect(service.update('m1', { teamId: 'team1', position: 'Dev' })).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    it('menolak menghapus member yang masih punya tugas aktif', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([{ task: { status: 'review' } }]));
      await expect(service.remove('m1')).rejects.toThrow(ConflictException);
      expect(membersRepo.remove).not.toHaveBeenCalled();
    });

    it('menghapus member bila semua tugasnya sudah done', async () => {
      membersRepo.findOne.mockResolvedValue(makeMember([{ task: { status: 'done' } }]));
      await expect(service.remove('m1')).resolves.toBe(true);
    });
  });
});
