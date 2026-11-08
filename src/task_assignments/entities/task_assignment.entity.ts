import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity.js';
import { Member } from '../../members/entities/member.entity.js';

export const ASSIGNMENT_ROLES = ['assignee', 'reviewer'] as const;

// tabel penghubung many-to-many antara tasks dan members
@Entity({ name: 'task_assignments' })
@Unique(['task', 'member'])
export class TaskAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // BANYAK TaskAssignment dimiliki oleh SATU Task
  @ManyToOne(() => Task, (task) => task.assignments, {
    nullable: false,
    onDelete: 'CASCADE', // Jika Task dihapus, penugasannya otomatis ikut terhapus!
  })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  // BANYAK TaskAssignment dimiliki oleh SATU Member
  @ManyToOne(() => Member, (member) => member.assignments, {
    nullable: false,
    onDelete: 'CASCADE', // Jika Member dihapus, penugasannya otomatis ikut terhapus!
  })
  @JoinColumn({ name: 'member_id' })
  member: Relation<Member>;

  @Column({ type: 'varchar', length: 20, default: 'assignee' })
  role: string;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}