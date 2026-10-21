require("dotenv").config();
const { Op } = require("sequelize");
const { kamar, kamar_inap, Sequelize } = require('./models');
const { ketersediaanKamarRS, updateKamar } = require('./controlers/kamar');

async function kalibrasiKamar() {
    try {
        // 1. Ambil daftar HANYA kd_kamar yang sedang terisi pasien
        const kamarInapAktif = await kamar_inap.findAll({
            where: { stts_pulang: '-' },
            attributes: ['kd_kamar'],
            group: ['kd_kamar'], // GROUP BY untuk mencegah duplikasi data jika 1 kamar >1 bed/pasien
            raw: true            // Bypass Sequelize model instantiation agar jauh lebih cepat
        });

        // Ekstrak hasil menjadi flat array: ['K01', 'K02', ...]
        const listKamarIsi = kamarInapAktif.map(item => item.kd_kamar);
        // 2. Sinkronisasi kamar yang seharunya 'KOSONG' (Status saat ini 'ISI' tapi tidak ada di listKamarIsi)
       let result = await kamar.update(
            { status: 'KOSONG' },
            {
                where: {
                    statusdata: '1',
                    status: 'ISI',
                    // Jika listKamarIsi kosong, semua kamar 'ISI' otomatis di-set 'KOSONG'
                    ...(listKamarIsi.length > 0 && {
                        kd_kamar: { [Op.notIn]: listKamarIsi }
                    })
                }
            }
        );
        console.log('update kamar kosong', result);

        // 3. Sinkronisasi kamar yang seharusnya 'ISI' (Status saat ini 'KOSONG' tapi ada di listKamarIsi)
        if (listKamarIsi.length > 0) {
           let resultISI = await kamar.update(
                { status: 'ISI' },
                {
                    where: {
                        statusdata: '1',
                        status: 'KOSONG',
                        kd_kamar: { [Op.in]: listKamarIsi }
                    }
                }
            );
            console.log('update kamar isi', resultISI);
        }

    } catch (error) {
        console.error("Gagal melakukan kalibrasi kamar:", error);
        throw error;
    }
}


async function updateKamarBPJS() {
    try {
        console.log("Mulai update ketersediaan kamar BPJS...");

    // 1. Ambil data dari BPJS
        const dataKamar = await ketersediaanKamarRS();
        if (!dataKamar?.response?.list) {
            console.log("Data ketersediaan dari BPJS kosong atau gagal ditarik.");
            return;
        }

        // 2. Lakukan 1x BULK QUERY ke database untuk menghitung SEMUA kamar kosong
        // Dikelompokkan berdasarkan bangsal dan kelas
        const rekapKamarKosong = await kamar.findAll({
            where: {
                statusdata: '1',
                status: 'KOSONG'
            },
            attributes: [
                'kd_bangsal',
                'kelas',
                [Sequelize.fn('COUNT', Sequelize.col('kd_kamar')), 'total_kosong']
            ],
            group: ['kd_bangsal', 'kelas'],
            raw: true
        });

        // 3. Ubah hasil query menjadi Object/Map agar pencarian data (look-up) instan (O(1))
        const mapKosong = {};
        const mapKosongBangsal = {}; // Untuk kondisi "else" (tanpa filter kelas)

        for (const row of rekapKamarKosong) {
            const jmlKosong = parseInt(row.total_kosong, 10) || 0;

            // Map berdasarkan bangsal + kelas (contoh key: 'B01_Kelas 1')
            mapKosong[`${row.kd_bangsal}_${row.kelas}`] = jmlKosong;

            // Rekap total per bangsal (menggabungkan semua kelas di bangsal tsb)
            if (!mapKosongBangsal[row.kd_bangsal]) mapKosongBangsal[row.kd_bangsal] = 0;
            mapKosongBangsal[row.kd_bangsal] += jmlKosong;
        }

        // 4. Objek Mapping untuk menerjemahkan kode kelas BPJS ke kelas Database Anda
        const mapKelasDB = {
            'KL1': 'Kelas 1',
            'KL2': 'Kelas 2',
            'KL3': 'Kelas 3',
            'VIP': 'Kelas VIP'
        };

        // 5. Looping sinkronisasi data
        for (const item of dataKamar.response.list) {
            const kelasDB = mapKelasDB[item.kodekelas];
            let findKOSONG = 0;

            // Jika kode kelas ada di mapping, cari spesifik bangsal + kelas. 
            // Jika tidak ada (kondisi else), ambil total kosong di bangsal tersebut.
            if (kelasDB) {
                findKOSONG = mapKosong[`${item.koderuang}_${kelasDB}`] || 0;
            } else {
                findKOSONG = mapKosongBangsal[item.koderuang] || 0;
            }

            const data = {
                kodekelas: item.kodekelas,
                koderuang: item.koderuang,
                namaruang: item.namaruang,
                kapasitas: item.kapasitas,
                tersedia: findKOSONG.toString(), // Pastikan formatnya string jika API membutuhkannya
                tersediapria: '0',
                tersediawanita: '0',
                tersediapriawanita: '0',
            };

            // 6. Update jika terjadi perbedaan
            if (String(item.tersedia) !== data.tersedia) {
                const update = await updateKamar(data);
                console.log(`[UPDATE] ${item.namaruang} (${item.kodekelas}) | Sisa: ${item.tersedia} -> ${data.tersedia}`);
            } else {
                // Log "Masih Sama" dipindah ke blok else agar tidak rancu
                // console.log(`[SAMA] ${item.namaruang} (${item.kodekelas})`); 
            }
        }

        console.log("Update Kamar BPJS Selesai");

    } catch (error) {
        console.error("Terjadi kesalahan saat update kamar BPJS:", error);
    }
}
kalibrasiKamar();
updateKamarBPJS();