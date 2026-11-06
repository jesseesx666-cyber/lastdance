# Menjalankan di VPS (database MySQL di VPS yang sama)

Cara ini paling aman: aplikasi dan MySQL berada di satu VPS, jadi port MySQL (3306) **tidak perlu dibuka ke internet**.

## 1. Pasang Node.js dan alat
```bash
sudo apt update && sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2
```

## 2. Akun database khusus aplikasi (bukan root)
```sql
CREATE USER 'lastdance'@'localhost' IDENTIFIED BY 'SANDI_KUAT';
GRANT SELECT, INSERT, UPDATE, DELETE ON lastdance.* TO 'lastdance'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Ambil kode dan bangun
```bash
git clone https://github.com/jesseesx666-cyber/lastdance.git /opt/lastdance
cd /opt/lastdance && npm ci && npm run build
```

## 4. Isi `/opt/lastdance/.env`
```
DATABASE_URL=mysql://lastdance:SANDI_KUAT@127.0.0.1:3306/lastdance
SESSION_SECRET=<teks acak panjang, mis. hasil: openssl rand -hex 32>
PORT=3001
HOST=127.0.0.1
ALLOW_ANY_HOST=1
DATA_DIR=/opt/lastdance-data
```
Sandi yang berisi simbol (`@`, `#`, `/`) harus di-URL-encode (mis. `@` menjadi `%40`).

## 5. Jalankan terus-menerus
```bash
cd /opt/lastdance && pm2 start npm --name lastdance -- start && pm2 save && pm2 startup
```
Cek: `pm2 logs lastdance` harus menampilkan `Database: MySQL`.

## 6. Nginx + HTTPS
`/etc/nginx/sites-available/lastdance`:
```
server {
  server_name domain-anda.com;
  client_max_body_size 8m;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/lastdance /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d domain-anda.com
```

## 7. Gambar lama
Gambar disimpan sebagai file di `DATA_DIR/thumbs`. Salin dari komputer lama:
```bash
scp -r E:/lastdancedbonline/data/thumbs user@vps:/opt/lastdance-data/
```

## Memperbarui
```bash
cd /opt/lastdance && git pull && npm ci && npm run build && pm2 restart lastdance
```
