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
import { Team } from '../../teams/entities/team.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';

export const PROJECT_STATUSES = ['planning', 'active', 'completed', 'archived'] as const;

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 30, default: 'planning' })
  status: string;

  @Column({ type: 'date', nullable: true, name: 'start_date' })
  startDate: string | null;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: string | null;

  // BANYAK Project dimiliki oleh SATU Team
  @ManyToOne(() => Team, (team) => team.projects, { nullable: false })
  @JoinColumn({ name: 'team_id' })
  team: Relation<Team>;

  // Satu Project memiliki BANYAK Task
  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}