# Memakai Google Sheets sebagai database

1. Buka spreadsheet > Extensions > Apps Script. Hapus isi default, tempel isi `apps-script/Code.gs`, Save.
2. Project Settings (ikon roda gigi) > Script Properties > Add: nama `TOKEN`, nilai = teks acak panjang buatan Anda.
3. Deploy > New deployment > jenis Web app > Execute as: **Me**, Who has access: **Anyone** > Deploy > izinkan akses. Salin URL yang berakhiran `/exec`.
4. Salin `.env.example` menjadi `.env` di folder projek, isi `SHEET_URL` (URL tadi) dan `SHEET_TOKEN` (teks yang sama dengan TOKEN).
5. Jalankan ulang aplikasi (`npm start`). Sheet kosong akan diisi otomatis; bila ada `data\instagram_analytics.xlsx`, isinya diimpor.

Catatan: gambar (sampul konten, grafik growth) tetap disimpan di folder `data\thumbs`, bukan di spreadsheet.
Jangan edit sheet Metrics/Reports secara manual saat aplikasi dipakai; aplikasi menulis ulang seluruh sheet.
