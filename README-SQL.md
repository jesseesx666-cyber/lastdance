# Database SQL (MySQL) — pengganti Google Sheets

Aplikasi ini sekarang menyimpan seluruh data ke **MySQL**, bukan lagi menulis ulang Google Sheets
lewat Apps Script. Bentuk data, API, analitik, dan tampilan **tidak berubah** — hanya lapisan
penyimpanannya.

```
Sebelum : Browser → API → Apps Script → Google Sheets (seluruh sheet ditulis ulang)
Sesudah : Browser → API → MySQL (INSERT/UPDATE/DELETE per baris, dalam transaksi + GET_LOCK)
```

Bila `DATABASE_URL` tidak diisi, aplikasi tetap jalan seperti biasa (Google Sheets / workbook lokal),
jadi migrasi bisa dicicil dan rollback cukup dengan menghapus variabel itu.

---

## 1. Skema

`db/schema.sql` membuat 14 tabel — satu tabel untuk setiap sheet lama:

| Sheet lama | Tabel SQL | Kunci utama |
|---|---|---|
| Users | `users` | `user_id` |
| Settings | `settings` | `setting_key` |
| Reports | `reports` | `report_id` |
| Metrics | `metrics` | `(report_id, metric_key)` |
| Contents | `contents` | `content_id` |
| Summary | `summary` | `item_id` |
| Activities | `activities` | `activity_id` |
| Influencers | `influencers` | `influencer_id` |
| Ads | `ads` | `ad_id` |
| Reservations | `reservations` | `reservation_id` |
| Maps | `maps` | `map_id` |
| Website | `website` | `web_id` |
| WhatsApp | `whatsapp` | `wa_id` |
| AuditLog | `audit_log` | `change_id` |

Catatan tipe data:

- `CHAR(36)` untuk UUID (MySQL tidak punya tipe UUID), `JSON` untuk data bertingkat, `DATE` untuk
  periode, `DATETIME(3)` untuk stempel waktu (dibaca sebagai teks agar tidak bergeser zona waktu).
- `metrics` tetap satu baris per metrik per laporan (30 baris/laporan), dengan foreign key
  `ON DELETE CASCADE` — hapus laporan langsung membersihkan metriknya.
- `maps.images`, `website.images`, `whatsapp.images` disimpan sebagai `JSON` berisi array nama file;
  `website.pages/articles/referrers` dan `whatsapp.top_chats/reservations/unavailable` juga `JSON`.
- `reservations.count` memakai backtick karena `count` nama fungsi bawaan MySQL.
- `audit_log` sengaja **tanpa foreign key**: jejak `delete` harus tetap ada walau laporannya hilang.
- Kolom `ENUM` dipakai untuk nilai tertutup (`role`, `status`, `section`, `kind`, `action`, `site`, `account` Maps).

View bantu: `v_report_metric` (pivot KPI per laporan), `v_map_rating` (rata-rata bintang benar),
`v_report_duplicates` (laporan akun+platform+periode sama).

---

## 2. Menyiapkan database

**Lokal (Docker):**
```bash
docker run -d --name lastdance-mysql -e MYSQL_ROOT_PASSWORD=rahasia -e MYSQL_DATABASE=lastdance -p 3306:3306 mysql:8.4
export DATABASE_URL="mysql://root:rahasia@127.0.0.1:3306/lastdance"
npm run db:setup
```

**Hosting (RDS / Cloud SQL / PlanetScale / VPS):** buat database + user, lalu:
```bash
DATABASE_URL="mysql://user:pass@host:3306/lastdance" DATABASE_SSL=1 npm run db:setup
```

Isi `.env`:
```
DATABASE_URL=mysql://user:password@host:3306/lastdance
DATABASE_SSL=0
SESSION_SECRET=teks-acak-panjang
```
`SHEET_URL`/`SHEET_TOKEN` boleh dihapus setelah migrasi.

> MariaDB 10.6+ juga jalan (tipe & view yang dipakai kompatibel).

---

## 3. Memindahkan data dari Google Sheets

```bash
# langsung dari URL spreadsheet (butuh akses "Anyone with the link")
DATABASE_URL="mysql://..." npm run db:import -- "https://docs.google.com/spreadsheets/d/<ID>/edit"

# atau dari file .xlsx hasil ekspor
DATABASE_URL="mysql://..." npm run db:import -- ./data/instagram_analytics.xlsx
```

Skrip akan: mengunduh spreadsheet → membaca 14 sheet → memetakan ke tabel → **mengosongkan tabel**
lalu mengisi ulang (mode migrasi). Tambahkan `--append` bila ingin menambah tanpa menghapus.

Hasil impor yang sudah diverifikasi untuk spreadsheet `1iVvelfRsB0Wyd...`:

```
users 5 · reports 24 · metrics 720 (312 terisi) · contents 15 · ads 23
reservations 13 · maps 2 · website 3 · whatsapp 1 · audit_log 83 · summary/activities/influencers 0
```

Skrip juga melaporkan laporan dobel yang ditemukan (akun+platform+periode sama) tanpa menghapusnya.

Setelah impor, cek kesehatan data & jalur tulis:
```bash
DATABASE_URL="mysql://..." npm run db:check
```
Keluarannya: jumlah baris per tabel, kelengkapan 30 metrik per laporan, hasil analitik satu minggu,
lalu uji tulis + hapus satu laporan sementara untuk memastikan benar-benar tersimpan di database.

---

## 4. Menjalankan aplikasi

```bash
npm run dev     # API + Vite (memakai DATABASE_URL dari .env)
npm start       # API + hasil build
```
Titik status di kanan atas akan menampilkan `MySQL` (dari `GET /api/health`).

**Netlify:** isi `DATABASE_URL` (+ `DATABASE_SSL=1` bila perlu) dan `SESSION_SECRET` di
Site configuration → Environment variables, lalu deploy ulang. `SHEET_URL`/`SHEET_TOKEN`
boleh dihapus. Batas waktu fungsi tidak lagi menjadi masalah karena penyimpanan tidak menulis
seluruh sheet.

---

## 5. Yang berubah di kode

| Berkas | Perubahan |
|---|---|
| `db/schema.sql` | **baru** — skema 14 tabel + index + view (MySQL) |
| `server/mysql.ts` | **baru** — store MySQL: `read`, `mutate` (transaksi + `GET_LOCK`), `exportFile` |
| `scripts/db-setup.ts` | **baru** — terapkan skema |
| `scripts/db-import.ts` | **baru** — impor dari Google Sheets / .xlsx |
| `scripts/db-check.ts` | **baru** — uji baca/tulis/analitik |
| `server/store.ts` | `fromSheets`, `toSheets`, `HEADERS`, `emptyData` diekspor; penyimpanan gambar dipisah ke `createThumbs` agar dipakai kedua store |
| `server/index.ts` | pilih store MySQL bila `DATABASE_URL` diisi |
| `netlify/functions/api.ts` | idem untuk fungsi Netlify |
| `package.json` | `mysql2`; skrip `db:setup`, `db:import`, `db:check` |
| `.env.example` | contoh `DATABASE_URL`, `DATABASE_SSL` |

Tidak ada perubahan pada `server/app.ts`, `server/analytics.ts`, `shared/*`, maupun halaman React:
kontrak `Store` (read/mutate/exportFile + gambar) dipertahankan.

---

## 6. Perilaku yang membaik

- **Tidak ada lagi tulis yang saling menimpa.** Dulu setiap simpan menulis ulang seluruh sheet
  (`clearContents` + `setValues`) dengan lock 30 detik; sekarang setiap perubahan adalah
  `INSERT/UPDATE/DELETE` dalam transaksi dengan `GET_LOCK('lastdance_store')`. Diuji 8 permintaan
  paralel: 8 laporan tersimpan, total views 3.600 — tidak ada yang hilang.
- **Hanya baris yang berubah yang ditulis** (diff terhadap kondisi saat dibaca).
- **Hapus laporan** otomatis menghapus 30 baris metriknya (foreign key cascade).
- **Export .xlsx** dibuat dari database, format kolom sama seperti workbook lama.
- **Cache baca 5 detik** (sebelumnya 10 detik) agar perubahan cepat terlihat.

## 7. Catatan & saran lanjutan

1. **Laporan dobel belum dicegah.** Skema tidak memasang `UNIQUE (account, platform, period_start,
   period_end)` karena data lama memang berisi dobel (bekam 4 laporan untuk periode yang sama,
   homecare 2). Setelah dobel dibersihkan, constraint itu layak ditambahkan:
   ```sql
   ALTER TABLE reports ADD CONSTRAINT reports_unique_period
     UNIQUE (account, platform, period_start, period_end);
   ```
2. **Metrik level akun masih disalin ke tiap platform** oleh kebiasaan input (reach/spend/lead sama
   di Instagram, Facebook, TikTok). Skema sudah siap; yang perlu diputuskan apakah metrik akun
   dipisah ke tabel sendiri (`account_metrics`) agar tidak dijumlahkan lintas platform.
3. **Backup**: `mysqldump --single-transaction` harian (atau snapshot/point-in-time dari penyedia
   database) jauh lebih aman daripada riwayat revisi Google Sheets.
4. **Rollback**: hapus `DATABASE_URL` → aplikasi kembali memakai Google Sheets tanpa perubahan kode.
5. **Batasi hak user database**: cukup SELECT/INSERT/UPDATE/DELETE pada schema aplikasi, bukan root.

## 8. Keamanan

- Password tetap `scrypt` + cookie HMAC; `password_hash` kini tersimpan di kolom `users.password_hash`
  (bukan di sheet yang bisa ikut terekspos bila spreadsheet dibagikan).
- Sambungkan lewat SSL (`DATABASE_SSL=1`) saat database berada di luar jaringan lokal.

---

## 9. Deploy: Netlify (tampilan) + API di VPS

Database tetap di VPS dan **tidak dibuka ke internet**. Netlify hanya menyajikan tampilan React,
sedangkan semua panggilan `/api/*` diteruskan ke API di VPS:

```
Browser → Netlify (dist) ──/api/*──► https://izinklinik.com/lastdance-api/* ──► 127.0.0.1:3990/api/*
                                                                               └─ MySQL lokal
```

Yang perlu ada di VPS:
1. Aplikasi API berjalan dengan `pm2` (contoh nama proses `lastdance-api`, port 3990) dan `.env`
   berisi `DATABASE_URL`, `SESSION_SECRET`, `DATA_DIR`, `PORT`.
2. Nginx pada domain ber-SSL punya lokasi proxy:
   ```nginx
   location ^~ /lastdance-api/ {
       proxy_pass http://127.0.0.1:3990/api/;
       proxy_set_header Host 127.0.0.1:3990;   # lolos pemeriksaan anti DNS-rebinding aplikasi
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_read_timeout 60s;
       client_max_body_size 20m;
   }
   ```

Yang perlu ada di Netlify: **tidak ada environment variable**. Cukup `netlify.toml`:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://izinklinik.com/lastdance-api/:splat"
  status = 200
  force = true
```

Catatan: gambar (thumbnail konten, grafik audiens) disimpan di `DATA_DIR/thumbs` pada VPS.
Bila sebelumnya gambar berada di Netlify Blobs, unggah ulang lewat form atau salin file ke folder itu.
