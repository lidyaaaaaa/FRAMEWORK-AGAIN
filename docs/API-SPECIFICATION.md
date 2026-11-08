# API Specification - Task Management System

Base URL: `http://localhost:3000`
Format request/response: `application/json`
Autentikasi: tidak ada (sesuai cakupan soal).

## 1. Format Response

Response sukses dibungkus oleh `TransformResponseInterceptor`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request berhasil",
  "data": { }
}
```

`DELETE` yang berhasil mengembalikan **204 No Content** (tanpa body).

### Format error

Semua error dibungkus oleh `AllExceptionsFilter` dengan format JSON yang sama:

```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2026-11-07T04:00:00.000Z",
  "path": "/tasks/00000000-0000-4000-8000-000000000000",
  "method": "GET",
  "error": "Tugas dengan id 00000000-0000-4000-8000-000000000000 tidak ditemukan"
}
```

Untuk validasi DTO, `error` berupa array pesan, contoh: `["Nama tim wajib diisi"]`.

| Jenis error | Status | Contoh isi `error` |
|---|---|---|
| Validasi DTO gagal (`ValidationPipe`) | 400 | `["Nama tim wajib diisi", "Format email tidak valid"]` |
| Format UUID pada path salah (`ParseUUIDPipe`) | 400 | `"Validation failed (uuid is expected)"` |
| Aturan bisnis dilanggar | 400 | `"Tenggat waktu tidak boleh sebelum hari ini"` |
| Data tidak ditemukan | 404 | `"Tugas dengan id ... tidak ditemukan"` |
| Konflik data (duplikat / masih punya relasi) | 409 | `"Tim \"Tim Backend\" sudah terdaftar"` |
| Kesalahan server tak terduga | 500 | `"Terjadi kesalahan internal pada server kami."` |

Validasi memakai `whitelist: true` dan `forbidNonWhitelisted: true`, jadi field di luar DTO ditolak dengan 400.

## 2. Ringkasan Endpoint

| Resource | Method | Endpoint | Deskripsi | Sukses |
|---|---|---|---|---|
| Health | GET | `/` | Cek aplikasi hidup | 200 |
| Teams | GET | `/teams` | Daftar tim (beserta members & projects) | 200 |
| | GET | `/teams/:id` | Detail tim | 200 |
| | POST | `/teams` | Buat tim | 201 |
| | PATCH | `/teams/:id` | Ubah tim | 200 |
| | DELETE | `/teams/:id` | Hapus tim | 204 |
| Members | GET | `/members` | Daftar anggota (beserta team) | 200 |
| | GET | `/members/:id` | Detail anggota (team & penugasan) | 200 |
| | POST | `/members` | Buat anggota | 201 |
| | PATCH | `/members/:id` | Ubah anggota | 200 |
| | DELETE | `/members/:id` | Hapus anggota | 204 |
| Projects | GET | `/projects` | Daftar proyek (beserta team) | 200 |
| | GET | `/projects/:id` | Detail proyek (team & tasks) | 200 |
| | POST | `/projects` | Buat proyek | 201 |
| | PATCH | `/projects/:id` | Ubah proyek | 200 |
| | DELETE | `/projects/:id` | Hapus proyek (tugas ikut terhapus) | 204 |
| Tasks | GET | `/tasks?projectId=&status=` | Daftar tugas, filter opsional | 200 |
| | GET | `/tasks/:id` | Detail tugas beserta anggota yang ditugaskan | 200 |
| | POST | `/tasks` | Buat tugas | 201 |
| | PATCH | `/tasks/:id` | Ubah data tugas (bukan status) | 200 |
| | PATCH | `/tasks/:id/status` | Ubah status tugas | 200 |
| | DELETE | `/tasks/:id` | Hapus tugas | 204 |
| TaskAssignments | GET | `/task-assignments` | Daftar penugasan | 200 |
| | GET | `/task-assignments/:id` | Detail penugasan | 200 |
| | POST | `/task-assignments` | Tugaskan task ke satu/lebih anggota | 201 |
| | PATCH | `/task-assignments/:id` | Ubah peran penugasan | 200 |
| | DELETE | `/task-assignments/:id` | Hapus penugasan | 204 |

Semua `:id` berupa UUID. Error umum untuk endpoint ber-`:id`: **400** (bukan UUID), **404** (tidak ditemukan).

## 3. Teams

### POST `/teams`

Request body:

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| name | string | ya | tidak kosong, maks 100, unik |
| description | string | tidak | - |

```json
{ "name": "Tim Backend", "description": "Tim pengembang API" }
```

Response `201`:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request berhasil",
  "data": {
    "id": "6f1c2c1e-3a53-4b7e-9d1b-0d6a1a2b3c4d",
    "name": "Tim Backend",
    "description": "Tim pengembang API",
    "createdAt": "2026-11-07T04:00:00.000Z",
    "updatedAt": "2026-11-07T04:00:00.000Z"
  }
}
```

Error: `400` validasi, `409` nama tim sudah ada.

### PATCH `/teams/:id`
Body sama seperti create, semua field opsional. Error: `400`, `404`, `409` (nama bentrok).

### DELETE `/teams/:id`
Error: `404`, `409` bila tim masih memiliki proyek.

### GET `/teams`, GET `/teams/:id`
Response berisi `members[]` dan `projects[]`.

## 4. Members

### POST `/members`

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| name | string | ya | tidak kosong, maks 150 |
| email | string | ya | format email, maks 150, unik |
| phone | string | tidak | 10-15 digit angka |
| position | string | tidak | maks 100 |
| teamId | UUID | tidak | tim harus ada |

```json
{
  "name": "Andi Pratama",
  "email": "andi@example.com",
  "phone": "081234567890",
  "position": "Backend Developer",
  "teamId": "6f1c2c1e-3a53-4b7e-9d1b-0d6a1a2b3c4d"
}
```

Response `201`: objek member (`id`, `name`, `email`, `phone`, `position`, `team`, `createdAt`, `updatedAt`).
Error: `400` validasi, `404` tim tidak ditemukan, `409` email sudah terdaftar.

### PATCH `/members/:id`
Semua field opsional. `teamId` berisi UUID untuk pindah tim, `null` untuk mengeluarkan anggota dari tim, atau tidak diisi bila tidak berubah.
Error: `400`, `404` (member/tim), `409` (email bentrok, atau anggota masih punya tugas aktif saat pindah/keluar tim).

### DELETE `/members/:id`
Ditolak (`409`) bila anggota masih punya penugasan pada tugas yang belum `done`. Penugasan pada tugas `done` ikut terhapus. Error: `404`, `409`.

## 5. Projects

### POST `/projects`

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| name | string | ya | tidak kosong, maks 150 |
| description | string | tidak | - |
| status | string | tidak | `planning` (default), `active`, `completed`, `archived` |
| startDate | date `YYYY-MM-DD` | tidak | - |
| endDate | date `YYYY-MM-DD` | tidak | tidak boleh < startDate |
| teamId | UUID | ya | tim harus ada |

```json
{
  "name": "Aplikasi Kasir",
  "status": "active",
  "startDate": "2026-11-01",
  "endDate": "2026-12-31",
  "teamId": "6f1c2c1e-3a53-4b7e-9d1b-0d6a1a2b3c4d"
}
```

Error: `400` (validasi / tanggal selesai < tanggal mulai), `404` tim tidak ditemukan.

### PATCH `/projects/:id`
Semua field opsional. Error: `400`, `404`.

### DELETE `/projects/:id`
Semua tugas dalam proyek (beserta penugasannya) ikut terhapus. Error: `404`.

### GET `/projects/:id`
Response berisi `team` dan `tasks[]`.

## 6. Tasks

### POST `/tasks`

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| title | string | ya | tidak kosong, maks 150 |
| description | string | tidak | - |
| priority | string | tidak | `low`, `medium` (default), `high`, `urgent` |
| dueDate | date `YYYY-MM-DD` | tidak | tidak boleh sebelum hari ini |
| projectId | UUID | ya | proyek harus ada dan tidak `completed`/`archived` |

Status awal selalu `todo`.

```json
{
  "title": "Rancang skema database",
  "priority": "high",
  "dueDate": "2026-11-14",
  "projectId": "b2a7c0de-1111-4222-8333-444455556666"
}
```

Response `201`:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request berhasil",
  "data": {
    "id": "c9d8e7f6-aaaa-4bbb-8ccc-ddddeeeeffff",
    "title": "Rancang skema database",
    "description": null,
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-11-14",
    "completedAt": null,
    "project": { "id": "b2a7c0de-1111-4222-8333-444455556666", "name": "Aplikasi Kasir" },
    "assignments": []
  }
}
```

Error: `400` (validasi, tenggat lewat, proyek completed/archived), `404` proyek tidak ditemukan.

### GET `/tasks`
Query opsional: `projectId` (UUID), `status` (`todo|in_progress|review|done`). Error: `400` bila nilai tidak valid.

### GET `/tasks/:id`
Detail tugas beserta `project` (dengan `team`) dan `assignments[]` (masing-masing berisi `member`):

```json
{
  "data": {
    "id": "c9d8e7f6-aaaa-4bbb-8ccc-ddddeeeeffff",
    "title": "Rancang skema database",
    "status": "in_progress",
    "assignments": [
      { "id": "…", "role": "assignee", "member": { "id": "…", "name": "Andi Pratama", "email": "andi@example.com" } },
      { "id": "…", "role": "reviewer", "member": { "id": "…", "name": "Budi Santoso", "email": "budi@example.com" } }
    ]
  }
}
```

### PATCH `/tasks/:id`
Field opsional: `title`, `description`, `priority`, `dueDate`. Field `status` ditolak (400), gunakan endpoint status. Error: `400`, `404`.

### PATCH `/tasks/:id/status`

```json
{ "status": "in_progress" }
```

Perpindahan yang diperbolehkan:

| Dari | Ke |
|---|---|
| `todo` | `in_progress` (wajib sudah ditugaskan ke minimal 1 anggota) |
| `in_progress` | `todo`, `review` |
| `review` | `in_progress`, `done` |
| `done` | `in_progress` |

Error `400`: status tidak valid, status sama dengan sebelumnya, perpindahan tidak diperbolehkan, atau tugas belum ditugaskan. `404`: tugas tidak ditemukan. Saat menjadi `done`, `completedAt` terisi otomatis.

### DELETE `/tasks/:id`
Penugasan ikut terhapus. Error: `404`.

## 7. Task Assignments

### POST `/task-assignments`

| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| taskId | UUID | ya | tugas harus ada dan belum `done` |
| memberIds | UUID[] | ya | minimal 1, tidak boleh duplikat, semua anggota harus ada |
| role | string | tidak | `assignee` (default) atau `reviewer` |

```json
{
  "taskId": "c9d8e7f6-aaaa-4bbb-8ccc-ddddeeeeffff",
  "memberIds": ["11111111-aaaa-4bbb-8ccc-000000000001", "11111111-aaaa-4bbb-8ccc-000000000002"],
  "role": "assignee"
}
```

Response `201`: array penugasan baru (masing-masing berisi `task` dan `member`). Seluruh anggota diproses dalam satu transaksi.

Error:

| Status | Penyebab |
|---|---|
| 400 | Validasi gagal; tugas sudah `done`; ada anggota yang bukan dari tim pemilik proyek |
| 404 | Tugas atau salah satu anggota tidak ditemukan |
| 409 | Ada anggota yang sudah ditugaskan pada tugas yang sama |

### PATCH `/task-assignments/:id`

```json
{ "role": "reviewer" }
```

Error: `400` (role tidak valid), `404`.

### GET `/task-assignments`, GET `/task-assignments/:id`
Response berisi `task` dan `member`.

### DELETE `/task-assignments/:id`
Penugasan terakhir pada tugas berstatus `in_progress` atau `review` tidak dapat dilepas (`400`); ubah status tugas ke `todo` dulu. Error: `400`, `404`.
