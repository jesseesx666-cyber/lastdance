# Memakai MySQL / MariaDB

Aplikasi memakai database ini bila variabel **`DATABASE_URL`** diisi. Tanpa itu, aplikasi memakai Google Sheets (`SHEET_URL` + `SHEET_TOKEN`) atau file Excel lokal.

## 1. Siapkan server database
Netlify tidak menjalankan database, jadi butuh MySQL 8 / MariaDB 10.6+ yang bisa dihubungi lewat internet (mis. TiDB Cloud, Aiven, Railway, atau server sendiri).

## 2. Impor database
```bash
mysql -h <host> -P 3306 -u <pengguna> -p < database/lastdance.sql
```
File itu membuat database `lastdance` beserta tabel dan datanya (pengguna, laporan, konten, dst.).
Bila penyedia hanya memberi satu database bernama lain, hapus baris `CREATE DATABASE` dan `USE` di awal file, lalu impor ke database itu.

## 3. Isi `DATABASE_URL`
```
mysql://pengguna:sandi@host:3306/lastdance
```
Bila host mewajibkan SSL: `mysql://pengguna:sandi@host:3306/lastdance?ssl={"rejectUnauthorized":true}`

- **Netlify:** Site configuration → Environment variables → tambah `DATABASE_URL` dan `SESSION_SECRET`, lalu deploy ulang.
- **Lokal:** tulis di `.env` (`DATABASE_URL=...`), lalu `npm start`.

## Catatan
- Gambar tetap disimpan sebagai file (lokal: `data/thumbs`, Netlify: Blobs); database hanya menyimpan nama filenya.
- Hanya baris yang berubah yang ditulis, di dalam satu transaksi.
- Data di Google Sheets tidak otomatis pindah; sumber datanya adalah `database/lastdance.sql`.
