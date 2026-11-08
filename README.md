# Task Management System (NestJS)

Backend API pengelolaan proyek dan tugas tim. Project kelompok UTS Framework Programming (NestJS), **Studi Kasus 4 - Task Management System**.

Entitas: `Teams`, `Members`, `Projects`, `Tasks`, `TaskAssignments`.

Teknologi: NestJS 12, TypeScript, TypeORM, PostgreSQL, class-validator / class-transformer, Postman.

## Struktur dokumen

| Dokumen | Lokasi |
|---|---|
| ERD | [`docs/ERD.md`](docs/ERD.md), gambar `docs/erd.png` |
| API Specification | [`docs/API-SPECIFICATION.md`](docs/API-SPECIFICATION.md) |
| Postman Collection | [`postman/task-management.postman_collection.json`](postman/task-management.postman_collection.json) |
| Request manual (.http) | [`task-management.http`](task-management.http) |

## Prasyarat

- Node.js 22 atau lebih baru
- Docker (untuk menjalankan PostgreSQL), atau PostgreSQL yang sudah terpasang

## Instalasi

```bash
# 1. install dependency
npm install

# 2. salin konfigurasi environment
cp .env.example .env

# 3. jalankan database PostgreSQL lewat Docker
docker compose up -d

# 4. buat tabel lewat migrasi
npm run migration:run
```

## Konfigurasi environment (`.env`)

| Variabel | Contoh | Keterangan |
|---|---|---|
| PORT | 3000 | Port aplikasi |
| NODE_ENV | development | `development` mengaktifkan log query TypeORM |
| DB_HOST | localhost | Host database |
| DB_PORT | 5432 | Port database |
| DB_USERNAME | taskadmin | Harus sama dengan `POSTGRES_USER` di `docker-compose.yml` |
| DB_PASSWORD | taskadmin123 | Harus sama dengan `POSTGRES_PASSWORD` |
| DB_DATABASE | task_management | Harus sama dengan `POSTGRES_DB` |

## Migrasi database

Skema database dikelola dengan migrasi TypeORM (`src/database/migrations/`, konfigurasi CLI di `src/config/data-source.ts`).

```bash
# menerapkan migrasi (membuat semua tabel)
npm run migration:run

# membatalkan migrasi terakhir
npm run migration:revert

# membuat migrasi baru setelah mengubah entity
npm run migration:generate -- src/database/migrations/NamaPerubahan
```

Catatan:

- Saat `NODE_ENV=development`, aplikasi juga menyalakan `synchronize` sehingga tabel dibuat otomatis. Untuk mencoba alur migrasi, jalankan `migration:run` pada database yang masih kosong **sebelum** menjalankan aplikasi pertama kali.
- Di luar development (`NODE_ENV=production`), `synchronize` mati dan skema hanya berubah lewat migrasi.

## Menjalankan aplikasi

```bash
# development (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod
```

Aplikasi berjalan di `http://localhost:3000`.

## Menjalankan pengujian

```bash
# unit test
npm run test
```

### Pengujian API dengan Postman

1. Pastikan aplikasi dan database berjalan.
2. Import `postman/task-management.postman_collection.json` ke Postman.
3. Buka **Collection Runner**, pilih collection, lalu **Run** secara berurutan (folder 00 sampai 07).
4. Variabel id (`teamId`, `taskId`, dll.) tersimpan otomatis. Data uji dibersihkan oleh folder 07.
5. Ubah variabel `baseUrl` bila aplikasi tidak berjalan di `http://localhost:3000`.

Skenario mencakup CRUD seluruh entitas, relasi, input tidak valid (400), id tidak ditemukan (404), konflik (409), dan aturan bisnis status tugas serta penugasan.

## Struktur kode

```
src/
├── app.module.ts            # konfigurasi TypeORM + registrasi module
├── main.ts                  # ValidationPipe, filter, interceptor global
├── common/
│   ├── filters/             # AllExceptionsFilter (format error standar)
│   ├── interceptors/        # TransformResponseInterceptor (format response standar)
│   └── middleware/          # SimpleLoggerMiddleware
├── config/                  # data-source.ts untuk TypeORM CLI
├── database/migrations/     # file migrasi
├── teams/                   # module, controller, service, entity, dto
├── members/
├── projects/
├── tasks/
└── task_assignments/        # tabel penghubung tasks <-> members
```

## Aturan bisnis utama

Lengkapnya ada di [`docs/ERD.md`](docs/ERD.md). Ringkasnya:

- Alur status tugas: `todo → in_progress → review → done` (lompat status ditolak).
- Tugas hanya dapat dikerjakan bila sudah ditugaskan ke minimal satu anggota.
- Penugasan hanya untuk anggota dari tim pemilik proyek, tidak boleh ganda.
- Tim yang masih memiliki proyek tidak dapat dihapus; menghapus proyek ikut menghapus tugasnya.
