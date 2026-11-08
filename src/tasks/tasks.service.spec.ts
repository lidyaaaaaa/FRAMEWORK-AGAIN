import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  let service: TasksService;
  const tasksRepo = { findOne: vi.fn(), find: vi.fn(), create: vi.fn(), save: vi.fn(), remove: vi.fn() };
  const projectsRepo = { findOne: vi.fn() };

  const makeTask = (status: string, assignments: unknown[] = []) => ({
    id: 't1',
    status,
    completedAt: null,
    assignments,
    project: { id: 'p1' },
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(Project), useValue: projectsRepo },
      ],
    }).compile();
    service = moduleRef.get(TasksService);
  });

  describe('create', () => {
    it('menolak tenggat waktu sebelum hari ini', async () => {
      await expect(
        service.create({ title: 'A', projectId: 'p1', dueDate: '2000-01-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('menolak bila proyek tidak ditemukan', async () => {
      projectsRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ title: 'A', projectId: 'p1' })).rejects.toThrow(NotFoundException);
    });

    it.each(['completed', 'archived'])('menolak tugas baru pada proyek berstatus %s', async (status) => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', status });
      await expect(service.create({ title: 'A', projectId: 'p1' })).rejects.toThrow(BadRequestException);
      expect(tasksRepo.save).not.toHaveBeenCalled();
    });

    it('membuat tugas dengan status awal todo', async () => {
      projectsRepo.findOne.mockResolvedValue({ id: 'p1', status: 'active' });
      tasksRepo.create.mockImplementation((v) => v);
      tasksRepo.save.mockResolvedValue({ id: 't1' });
      tasksRepo.findOne.mockResolvedValue(makeTask('todo'));

      await service.create({ title: 'A', projectId: 'p1' });

      expect(tasksRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'todo' }));
    });
  });

  describe('updateStatus', () => {
    it('menolak bila status sama', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask('todo'));
      await expect(service.updateStatus('t1', { status: 'todo' })).rejects.toThrow(/sudah berstatus/);
    });

    it('menolak lompat status todo -> done', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask('todo'));
      await expect(service.updateStatus('t1', { status: 'done' })).rejects.toThrow(BadRequestException);
    });

    it('menolak todo -> in_progress bila belum ada penugasan', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask('todo', []));
      await expect(service.updateStatus('t1', { status: 'in_progress' })).rejects.toThrow(
        /minimal satu anggota/,
      );
      expect(tasksRepo.save).not.toHaveBeenCalled();
    });

    it('mengizinkan todo -> in_progress bila sudah ada penugasan', async () => {
      const task = makeTask('todo', [{ id: 'a1' }]);
      tasksRepo.findOne.mockResolvedValue(task);
      tasksRepo.save.mockResolvedValue(task);

      await service.updateStatus('t1', { status: 'in_progress' });

      expect(tasksRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }));
    });

    it('mengisi completedAt saat done dan mengosongkannya saat dibuka kembali', async () => {
      const task = makeTask('review', [{ id: 'a1' }]);
      tasksRepo.findOne.mockResolvedValue(task);
      tasksRepo.save.mockImplementation((t) => Promise.resolve(t));

      await service.updateStatus('t1', { status: 'done' });
      expect(task.completedAt).toBeInstanceOf(Date);

      await service.updateStatus('t1', { status: 'in_progress' });
      expect(task.completedAt).toBeNull();
    });
  });

  describe('findById', () => {
    it('melempar NotFoundException bila tugas tidak ada', async () => {
      tasksRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });

    it('memuat daftar anggota yang ditugaskan', async () => {
      tasksRepo.findOne.mockResolvedValue(makeTask('todo'));
      await service.findById('t1');
      expect(tasksRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { project: { team: true }, assignments: { member: true } } }),
      );
    });
  });
});
