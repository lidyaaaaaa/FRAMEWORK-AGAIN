import { DataSource } from 'typeorm';

// Konfigurasi khusus TypeORM CLI (migration:generate / migration:run / migration:revert)
// membaca file .env di root project
try {
  process.loadEnvFile();
} catch {
  // .env tidak ada: pakai environment variable sistem
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  // Wajib bernilai false agar migrasi memegang kendali penuh!
  synchronize: false,
});
