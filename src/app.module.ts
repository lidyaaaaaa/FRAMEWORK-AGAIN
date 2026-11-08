import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SimpleLoggerMiddleware } from './common/middleware/simple-logger/simple-logger.middleware.js';

// Modules
import { MembersModule } from './members/members.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TaskAssignmentsModule } from './task_assignments/task_assignments.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { TeamsModule } from './teams/teams.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true, // entity otomatis terdaftar dari TypeOrmModule.forFeature()
        // tabel dibuat otomatis HANYA saat development; selain itu gunakan migrasi (npm run migration:run)
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    // Feature modules
    MembersModule,
    ProjectsModule,
    TaskAssignmentsModule,
    TasksModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SimpleLoggerMiddleware).forRoutes('*');
  }
}
