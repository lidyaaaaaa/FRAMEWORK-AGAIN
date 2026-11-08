import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TaskAssignment } from './entities/task_assignment.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Member } from '../members/entities/member.entity.js';
import { TaskAssignmentsService } from './task_assignments.service.js';

describe('TaskAssignmentsService', () => {
  let service: TaskAssignmentsService;
  const assignmentsRepo = {
    find: vi.fn(),
    findOne: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
  };
  const tasksRepo = { findOne: vi.fn() };
  const membersRepo = { find: vi.fn() };
  const dataSource = { transaction: vi.fn() };

  const team = { id: 'team1', name: 'Alpha' };
  const task = (status = 'todo') => ({ id: 't1', status, project: { team } });
  const member = (id: string, teamId: string | null = 'team1') => ({
    id,
    name: `M-${id}`,
    team: teamId ? { id: teamId } : null,
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TaskAssignmentsService,
        { provide: getRepositoryToken(TaskAssignment), useValue: assignmentsRepo },
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(TaskAssignmentsService);
  });

  describe('create', () => {
    it('menolak bila tugas tidak ditemukan', async () => {
      tasksRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ taskId: 't1', memberIds: ['m1'] })).rejects.toThrow(NotFoundException);
    });

    it('menolak penugasan pada tugas done', async () => {
      tasksRepo.findOne.mockResolvedValue(task('done'));
      await expect(service.create({ taskId: 't1', memberIds: ['m1'] })).rejects.toThrow(BadRequestException);
    });

    it('menolak bila ada member yang tidak ditemukan', async () => {
      tasksRepo.findOne.mockResolvedValue(task());
      membersRepo.find.mockResolvedValue([member('m1')]);
      await expect(service.create({ taskId: 't1', memberIds: ['m1', 'm2'] })).rejects.toThrow(NotFoundException);
    });

    it('menolak member dari tim lain atau tanpa tim', async () => {
      tasksRepo.findOne.mockResolvedValue(task());
      membersRepo.find.mockResolvedValue([member('m1'), member('m2', 'team2'), member('m3', null)]);
      await expect(service.create({ taskId: 't1', memberIds: ['m1', 'm2', 'm3'] })).rejects.toThrow(
        /bukan anggota tim/,
      );
    });

    it('menolak penugasan ganda (409)', async () => {
      tasksRepo.findOne.mockResolvedValue(task());
      membersRepo.find.mockResolvedValue([member('m1')]);
      assignmentsRepo.find.mockResolvedValue([{ member: member('m1') }]);
      await expect(service.create({ taskId: 't1', memberIds: ['m1'] })).rejects.toThrow(ConflictException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('menyimpan beberapa anggota dalam satu transaksi dengan role default assignee', async () => {
      tasksRepo.findOne.mockResolvedValue(task());
      membersRepo.find.mockResolvedValue([member('m1'), member('m2')]);
      assignmentsRepo.find.mockResolvedValue([]);

      const txRepo = {
        create: vi.fn((v) => v),
        save: vi.fn((v) => Promise.resolve({ ...v, id: `a-${v.member.id}` })),
        find: vi.fn().mockResolvedValue(['hasil']),
      };
      dataSource.transaction.mockImplementation((cb) => cb({ getRepository: () => txRepo }));

      const result = await service.create({ taskId: 't1', memberIds: ['m1', 'm2'] });

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(txRepo.save).toHaveBeenCalledTimes(2);
      expect(txRepo.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'assignee' }));
      expect(result).toEqual(['hasil']);
    });
  });

  describe('remove', () => {
    it.each(['in_progress', 'review'])(
      'menolak melepas penugasan terakhir pada tugas %s',
      async (status) => {
        assignmentsRepo.findOne.mockResolvedValue({ id: 'a1', task: task(status), member: member('m1') });
        assignmentsRepo.count.mockResolvedValue(1);
        await expect(service.remove('a1')).rejects.toThrow(BadRequestException);
        expect(assignmentsRepo.remove).not.toHaveBeenCalled();
      },
    );

    it('mengizinkan melepas bila masih ada penugasan lain', async () => {
      assignmentsRepo.findOne.mockResolvedValue({ id: 'a1', task: task('in_progress'), member: member('m1') });
      assignmentsRepo.count.mockResolvedValue(2);
      await expect(service.remove('a1')).resolves.toBe(true);
    });

    it('mengizinkan melepas penugasan terakhir pada tugas todo', async () => {
      assignmentsRepo.findOne.mockResolvedValue({ id: 'a1', task: task('todo'), member: member('m1') });
      await expect(service.remove('a1')).resolves.toBe(true);
      expect(assignmentsRepo.count).not.toHaveBeenCalled();
    });
  });
});
