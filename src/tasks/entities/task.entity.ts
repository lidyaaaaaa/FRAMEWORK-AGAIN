import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';
import { TaskAssignment } from '../../task_assignments/entities/task_assignment.entity.js';

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 30, default: 'todo' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: string;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  // BANYAK Task dimiliki oleh SATU Project
  @ManyToOne(() => Project, (project) => project.tasks, {
    nullable: false,
    onDelete: 'CASCADE', // Jika Project dihapus, seluruh Task-nya otomatis ikut terhapus!
  })
  @JoinColumn({ name: 'project_id' })
  project: Relation<Project>;

  // Satu Task memiliki BANYAK TaskAssignment
  @OneToMany(() => TaskAssignment, (assignment) => assignment.task)
  assignments: TaskAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}