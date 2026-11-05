# Deploy ke Netlify

Data disimpan di MySQL (lihat `README-SQL.md`); gambar di Netlify Blobs (otomatis, tanpa setup).
Mode Google Sheets lama masih bisa dipakai bila `DATABASE_URL` tidak diisi (`SHEET_URL` + `SHEET_TOKEN`).

1. Jalankan `npm run pack:netlify` (hasilnya folder `netlify-deploy`, sudah termasuk API yang di-bundle).
   Lalu di Netlify: **Add new site > Deploy manually**, drag folder `netlify-deploy` ke halaman itu.
   Setiap ada perubahan kode: jalankan lagi perintah itu dan drag ulang (di tab **Deploys** situs yang sama).
2. **Site configuration > Environment variables**, isi:
   - `DATABASE_URL` : connection string MySQL (mis. `mysql://user:pass@host:3306/lastdance`), atau
     `SHEET_URL` + `SHEET_TOKEN` bila masih memakai Google Sheets
   - `DATABASE_SSL` : `1` bila penyedia database mewajibkan SSL
   - `SESSION_SECRET`: teks acak panjang (mis. 64 karakter), jangan dibagikan
3. Setelah mengisi variable, deploy ulang (drag lagi folder yang sama). Buka situs, login dengan akun yang sudah ada di sheet.
4. Pindahkan 4 gambar lama (sekali saja), setelah situs ada:
   `NETLIFY_SITE_ID=<Site ID> NETLIFY_TOKEN=<Personal access token> node scripts/upload-thumbs.mjs`
   (Site ID: Site configuration > General; token: User settings > Applications).

Catatan: fungsi Netlify default batas 10 detik. Penyimpanan hanya mengirim sheet yang berubah (±2–4 detik),
tetapi simpan laporan yang mengubah banyak sheet bisa lebih lama; bila timeout, naikkan batas di pengaturan Functions.
