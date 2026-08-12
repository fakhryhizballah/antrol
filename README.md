# Antrol

Antrol adalah **backend** berbasis Node.js yang berfungsi sebagai sistem antrian dan integrasi dengan layanan BPJS serta sistem kesehatan lainnya. Proyek ini dirancang untuk memproses data pasien, mengelola antrian, dan menyiapkan data untuk sistem *Electronic Health Record* (EHR) seperti Satu Sehat.

## 📦 Tech Stack

| Komponen | Versi | Keterangan |
|----------|-------|------------|
| **Node.js** | 18.x | Runtime JavaScript |
| **Express** | - | (Tidak secara eksplisit terdaftar, namun digunakan sebagai framework HTTP) |
| **Sequelize** | ^6.37.8 | ORM untuk MariaDB |
| **MariaDB** | ^3.5.3 | Database relasional |
| **Redis** | ^6.2.1 | Cache dan queue (opsional) |
| **Axios** | ^1.19.0 | HTTP client untuk panggilan API eksternal |
| **dotenv** | ^17.4.2 | Memuat variabel lingkungan dari `.env` |
| **lz-string** | ^1.5.0 | Kompresi string (digunakan di helper) |

## 📁 Struktur Proyek

```
├─ config
│  └─ config.js          # Konfigurasi database & environment
├─ controlers
│  └─ antrol.js          # Logika utama (queue, penjadwalan, integrasi BPJS)
├─ helpers
│  ├─ bpjs.js            # Helper BPJS
│  └─ index.js           # Export helper
├─ models
│  ├─ ...                # Model Sequelize (pasien, dokter, poliklinik, dll)
├─ index.js              # Entry point aplikasi
├─ package.json
└─ .env.example          # Contoh file .env
```

### `config/config.js`
File ini memuat konfigurasi Sequelize yang diambil dari variabel lingkungan:
```
DB_USERNAME
DB_PASSWORD
DB_NAME
DB_HOST
DB_DIALECT
```
Pastikan file `.env` berisi nilai-nilai tersebut.

### `controlers/antrol.js`
Berisi fungsi-fungsi utama seperti:
- `getAntrian` – ambil data antrian
- `addAntrean` – tambahkan antrian baru
- `updatewaktu` – update waktu tugas
- `getlisttask` – ambil daftar task
- `kirimBatal` – kirim status batal
- dll.

### `index.js`
Entry point yang memanggil fungsi `tambahAntreanJKN` dan `selesaikanManual` pada tanggal saat ini.

## 🚀 Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/fakhryhizballah/antrol.git
   cd antrol
   ```
2. **Install dependensi**
   ```bash
   npm install
   ```
3. **Siapkan file `.env`**
   Salin contoh file:
   ```bash
   cp .env.example .env
   ```
   dan isi dengan kredensial database serta variabel lain yang diperlukan.
4. **Jalankan aplikasi**
   ```bash
   node index.js
   ```
   Aplikasi akan memproses antrian dan mengeksekusi fungsi `tambahAntreanJKN` serta `selesaikanManual` secara otomatis.

## 📚 Penggunaan

- **Menambah antrian JKN** – fungsi `tambahAntreanJKN` akan mengambil data registrasi dari database dan menambahkan antrian ke sistem BPJS.
- **Menangani antrian** – fungsi `selesaikanManual` memproses antrian yang belum dilayani, memeriksa status, dan mengirimkan update ke BPJS.
- **Logging** – aplikasi mencetak log ke konsol. Untuk produksi, pertimbangkan menggunakan logger seperti `winston`.

## 🤝 Kontribusi
1. Fork repository.
2. Buat branch fitur: `git checkout -b fitur/penambahan-fitur`.
3. Commit perubahan: `git commit -m "Deskripsi singkat"`.
4. Push ke fork: `git push origin fitur/penambahan-fitur`.
5. Buat Pull Request ke branch `main`.

Pastikan semua unit test (jika ada) lulus sebelum mengirim PR.

## 📄 Lisensi
MIT License – lihat file `LICENSE`.

---

> **Catatan**: README ini dibuat tanpa mengubah kode sumber. Semua informasi diambil dari konfigurasi dan struktur proyek yang ada.
