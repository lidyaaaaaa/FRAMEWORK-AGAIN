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
import { TaskAssignment } from '../../task_assignments/entities/task_assignment.entity.js';

@Entity({ name: 'members' })
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position: string | null;

  // BANYAK Member dimiliki oleh SATU Team (boleh kosong)
  @ManyToOne(() => Team, (team) => team.members, {
    nullable: true,
    onDelete: 'SET NULL', // Jika Team dihapus, member tetap ada tanpa tim
  })
  @JoinColumn({ name: 'team_id' })
  team: Relation<Team> | null;

  // Satu Member menerima BANYAK TaskAssignment
  @OneToMany(() => TaskAssignment, (assignment) => assignment.member)
  assignments: TaskAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}