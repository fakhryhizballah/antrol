/**
 * File: index.js
 * Penjelasan: File utama aplikasi yang memulai server Express dan mengatur rute.
 * Semua komentar di dalam file ini ditulis dalam Bahasa Indonesia.
 */
const { referensi_mobilejkn_bpjs, reg_periksa, pemeriksaan_ralan, maping_poli_bpjs, maping_dokter_dpjpvclaim, pasien, poliklinik, bridging_sep, trackersql } = require("./models");
const { Op } = require("sequelize");
const {
    getAntrian,
    dashboard,
    getBelum,
    getlisttask,
    kirimBatal,
    updatewaktu,
    addAntrean,
    getjadwaldokter,
    getRujukanPCare,
    getRujukanRS,
    getRencanaKontrol
} = require('./controlers/antrol');
const { convmils, getRandomTimeInMillis, stringToEpoch, setStingTodate } = require('./helpers');
const debug = process.env.DEBUG === 'true';

async function selesaikan(date) {
    let data = await getBelum();
    for (let x of data.response) {
        if (x.sumberdata == 'Mobile JKN' && x.tanggal == date) {

            let cekStatusReg = await referensi_mobilejkn_bpjs.findOne({
                where: {
                    nobooking: x.kodebooking
                },
                attributes: ['no_rawat', 'status', 'validasi', "statuskirim"],
                include: [
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        attributes: ['jam_reg', 'stts_daftar', 'status_lanjut', 'stts']
                    }
                ]
            });
            if (debug) console.log(JSON.stringify(cekStatusReg, null, 2));
            if (cekStatusReg.reg_periksa.status_lanjut != 'Ralan' || cekStatusReg.reg_periksa.stts == 'Batal') {
                console.log("Batal Antrean");
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;
            }
            let statusTaksid = await getlisttask(x.kodebooking);
            if (statusTaksid.metadata.code == 200) {
                console.log(statusTaksid.response);
                let cekSoap = await pemeriksaan_ralan.findAll({
                    where: {
                        no_rawat: cekStatusReg.no_rawat
                    },
                    order: [
                        ['jam_rawat', 'ASC'],
                    ],
                    attributes: ['no_rawat', 'jam_rawat', 'nip']
                })
                console.log(JSON.stringify(cekSoap, null, 2));
                if (cekSoap.length >= 2) {
                    let lastTaksID = statusTaksid.response[statusTaksid.response.length - 1];
                    console.log(lastTaksID);
                    let wakturs = stringToEpoch(lastTaksID.wakturs);
                    console.log(wakturs);
                    let nextTime = wakturs + getRandomTimeInMillis(2, 5);
                    console.log(nextTime);
                    let data = {
                        kodebooking: x.kodebooking,
                        taskid: lastTaksID.taskid + 1,
                        waktu: nextTime,
                    };
                    let updateTaksid = await updatewaktu(data);
                    let nextTime2 = nextTime + getRandomTimeInMillis(2, 5);
                    let data2 = {
                        kodebooking: x.kodebooking,
                        taskid: lastTaksID.taskid + 2,
                        waktu: nextTime,
                    };
                    let updateTaksid2 = await updatewaktu(data2);
                    console.log(updateTaksid2);

                }


            }


        }
        if (x.sumberdata == 'Bridging Antrean' && x.tanggal == date) {
            console.log(JSON.stringify(x, null, 2));
            let cekSoap = await pemeriksaan_ralan.findAll({
                where: {
                    no_rawat: x.kodebooking
                },
                order: [
                    ['jam_rawat', 'ASC'],
                ],
                attributes: ['no_rawat', 'jam_rawat', 'nip']
            })
            if (debug) console.log(JSON.stringify(cekSoap, null, 2));
            if (cekSoap.length >= 2) {
                console.log('cekSoap.length >= 2');
                let statusTaksid = await getlisttask(x.kodebooking);
                console.log(statusTaksid);
                if (statusTaksid.metadata.code == 204) {
                    const baseTimeSoap0 = new Date(`${date} ${cekSoap[0].jam_rawat}`).getTime();
                    const baseTimeSoap1 = new Date(`${date} ${cekSoap[1].jam_rawat}`).getTime();

                    const tasks = [
                        { taskid: 1, waktu: baseTimeSoap0 - getRandomTimeInMillis(4, 5) },
                        { taskid: 2, waktu: (baseTimeSoap0 - getRandomTimeInMillis(2, 3)) },
                        { taskid: 3, waktu: baseTimeSoap0 },
                        { taskid: 4, waktu: baseTimeSoap1 },
                        { taskid: 5, waktu: baseTimeSoap1 + getRandomTimeInMillis(1, 3) },
                    ];

                    for (const task of tasks) {
                        const updateResult = await updatewaktu({ kodebooking: x.kodebooking, ...task });
                        console.log(updateResult);
                    }
                }

                return;
            }
            console.log('cekSoap.length <= 2');
        }
    }
}
// selesaikanManual('2026-08-12');

async function selesaikanManual(date) {
    let data = await getAntrian(date);
    if (data.metadata.code !== 200) return data;

    const pending = data.response.filter(item => item.status != 'Selesai dilayani' && item.status != 'Batal');

    for (const x of pending) {
        if (x.sumberdata == 'Bridging Antrean') {
            let cekStatusReg = await reg_periksa.findOne({
                where: {
                    no_rawat: x.kodebooking
                },
                attributes: ['jam_reg', 'stts_daftar', 'status_lanjut', 'stts']

            })
            if (cekStatusReg == null) {
                console.log('batal ' + x.kodebooking);
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;
            }
            if (cekStatusReg.stts == 'Batal') {
                console.log('batal ' + x.kodebooking);
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;

            }
            if (cekStatusReg.status_lanjut != 'Ralan') {
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;
            }
            let statusTaksid = await getlisttask(x.kodebooking);
            console.log(statusTaksid);
            let cekSoap = await pemeriksaan_ralan.findOne({
                where: {
                    no_rawat: x.kodebooking
                },
                order: [
                    ['jam_rawat', 'ASC'],
                ],
                attributes: ['no_rawat', 'jam_rawat', 'nip']
            })
            if (!cekSoap) {
                console.log('belum ada soap ' + x.kodebooking);
                continue;
            }
            if (statusTaksid.metadata.code == 204) {
                if (x.ispeserta == true) {
                    let findSEP = await bridging_sep.findOne({
                        where: {
                            no_rawat: x.kodebooking
                        },
                        attributes: ['no_sep']
                    })
                    console.log(findSEP);
                    if (findSEP) {
                        console.log(findSEP.no_sep);
                        let tracekrSEP = await trackersql.findOne({
                            where: {
                                // tanggal: { [Op.between]: new Date(`${date} 00:00:00`), [Op.lte]: new Date(`${date} 23:59:59`) },
                                tanggal: { [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`] },
                                sqle: { [Op.substring]: `insert into bridging_sep values(|${findSEP.no_sep}|${x.kodebooking}` }
                            },
                            attributes: ['tanggal']
                        })
                        console.log(tracekrSEP)
                        if (!tracekrSEP) {
                            console.log('belum ada sep ' + x.kodebooking);
                            continue;
                        }
                        let taksid3 = new Date(tracekrSEP.tanggal).getTime();
                        console.log(taksid3);
                        let taksid4 = new Date(`${date} ${cekSoap.jam_rawat}`).getTime();
                        console.log(cekSoap.jam_rawat);
                        console.log(taksid4);
                        const tasks = [
                            { taskid: 1, waktu: (taksid3 - getRandomTimeInMillis(5, 7)) },
                            { taskid: 2, waktu: (taksid3 - getRandomTimeInMillis(2, 3)) },
                            { taskid: 3, waktu: taksid3 },
                            { taskid: 4, waktu: taksid4 },
                            { taskid: 5, waktu: taksid4 + getRandomTimeInMillis(2, 5) },
                        ];

                        for (const task of tasks) {
                            const updateResult = await updatewaktu({ kodebooking: x.kodebooking, ...task });
                            console.log(updateResult);
                        }
                        // return;
                    }

                } else {
                    console.log(x.ispeserta + ' ' + x.kodebooking);
                    console.log(cekSoap.jam_rawat);
                    let taksid4 = new Date(`${date} ${cekSoap.jam_rawat}`).getTime();
                    let taksid3 = taksid4 - getRandomTimeInMillis(5, 20);
                    let taksid2 = taksid3 - getRandomTimeInMillis(2, 5);
                    let taksid1 = taksid2 - getRandomTimeInMillis(1, 6);
                    console.log(taksid4);
                    const tasks = [
                        { taskid: 1, waktu: taksid1 },
                        { taskid: 2, waktu: taksid2 },
                        { taskid: 3, waktu: taksid3 },
                        { taskid: 4, waktu: taksid4 },
                        { taskid: 5, waktu: taksid4 + getRandomTimeInMillis(3, 5) },
                    ];

                    for (const task of tasks) {
                        const updateResult = await updatewaktu({ kodebooking: x.kodebooking, ...task });
                        console.log(updateResult);
                    }
                }
            }
            if (statusTaksid.metadata.code == 200) {
                let lastTaksID = statusTaksid.response[statusTaksid.response.length - 1];
                console.log(lastTaksID);

                let wakturs = stringToEpoch(lastTaksID.wakturs);
                let nextTime = wakturs + getRandomTimeInMillis(2, 5);
                let data = {
                    kodebooking: x.kodebooking,
                    taskid: lastTaksID.taskid + 1,
                    waktu: nextTime
                };
                let updateTaksid = await updatewaktu(data);
                console.log(updateTaksid);
            }

        }
        if (x.sumberdata == 'Mobile JKN') {
            let cekStatusReg = await referensi_mobilejkn_bpjs.findOne({
                where: {
                    nobooking: x.kodebooking
                },
                attributes: ['no_rawat', 'status', 'validasi', "statuskirim"],
                include: [
                    {
                        model: reg_periksa,
                        as: 'reg_periksa',
                        attributes: ['jam_reg', 'stts_daftar', 'status_lanjut', 'stts']
                    }
                ]
            });
            if (debug) console.log(JSON.stringify(cekStatusReg, null, 2));
            if (cekStatusReg.reg_periksa == null) {
                console.log("Batal Antrean");
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;
            }
            if (cekStatusReg.reg_periksa.status_lanjut != 'Ralan' || cekStatusReg.reg_periksa.stts == 'Batal') {
                console.log("Batal Antrean");
                let result = await kirimBatal(x.kodebooking, 'Batal Periksa');
                console.log(result);
                continue;
            }
            let statusTaksid = await getlisttask(x.kodebooking);
            let cekSoap = await pemeriksaan_ralan.findOne({
                where: {
                    no_rawat: cekStatusReg.no_rawat
                },
                order: [
                    ['jam_rawat', 'ASC'],
                ],
                attributes: ['no_rawat', 'jam_rawat', 'nip']
            })
            let findTaksid = await getlisttask(cekStatusReg.no_rawat);
            if (findTaksid.metadata.code == 200) {
                for (let y of findTaksid.response) {
                    let wakturs = stringToEpoch(y.wakturs);
                    let data = {
                        kodebooking: x.kodebooking,
                        taskid: y.taskid,
                        waktu: wakturs
                    };
                    let updateTaksid = await updatewaktu(data);
                    console.log(updateTaksid);
                }
            }

        }
    }
    const counts = pending.reduce(
        (acc, item) => {
            if (item.sumberdata === 'Bridging Antrean') acc.bridging += 1;
            if (item.sumberdata === 'Mobile JKN') acc.mobile += 1;
            return acc;
        },
        { bridging: 0, mobile: 0 }
    );

    console.log(`Bridging Antrean: ${counts.bridging}`);
    console.log(`Mobile JKN: ${counts.mobile}`);
    return;

}


// selesaikanManual('2026-08-12');
async function tambahAntrean(date) {
    // Fetch existing queue data for the given date
    let res = await getAntrian(date);
    let kodebooking = [];
    console.log(res);
    if (res.metadata.code == 200) {
        kodebooking = res.response.map((item) => item.kodebooking);
    }

    // Retrieve registrations not yet in queue
    let regBooking = await reg_periksa.findAll({
        where: {
            no_rawat: { [Op.notIn]: kodebooking },
            tgl_registrasi: { [Op.gte]: date },
            status_lanjut: 'Ralan',
            kd_poli: { [Op.notIn]: ['IGDK', 'U0031', 'U0003', 'U0008', 'U0022', 'U0055', 'U0054', 'U0057', 'U0058', 'U0056'] },
        },
        attributes: ['no_reg', 'no_rawat', 'tgl_registrasi', 'no_rkm_medis', 'jam_reg', 'kd_pj', 'kd_dokter', 'kd_poli', 'status_poli'],
        order: [
            ['jam_reg', 'DESC'],
        ],
        include: [{
            model: maping_poli_bpjs,
            as: 'maping_poli_bpjs',
            attributes: ['kd_poli_bpjs', 'nm_poli_bpjs']
        }, {
            model: maping_dokter_dpjpvclaim,
            as: 'maping_dokter_dpjpvclaim',
            attributes: ['kd_dokter_bpjs', 'nm_dokter_bpjs']
        }, {
            model: pasien,
            as: 'pasien',
            attributes: ['no_ktp', 'no_tlp', 'no_peserta']
        }
        ],
    });

    for (let element of regBooking) {
        try {
            let jeniskunjungan
            let noRef
            let jenispasien = 'JKN';
            if (element.kd_pj != 'BPJ') {
                jenispasien = 'NON JKN';
                noRef = '-';
                jeniskunjungan = 3
            } else {
                if (element.status_poli == 'Baru') {
                    jeniskunjungan = 1;
                    rujukan = await getRujukanPCare(element.pasien.no_peserta);
                    if (rujukan.response == null) {
                        rujukan = await getRujukanRS(element.pasien.no_peserta);
                        jeniskunjungan = 4
                    }
                    noRef = rujukan.response.rujukan.noKunjungan
                } else {
                    jeniskunjungan = 3;
                    let bulan = element.tgl_registrasi.substring(5, 7);
                    let tahun = element.tgl_registrasi.substring(0, 4);
                    let rencanaKontrol = await getRencanaKontrol(bulan, tahun, element.pasien.no_peserta);
                    if (rencanaKontrol.response == null) {
                        jeniskunjungan = 2;
                        noRef = `X/${element.no_rawat}`
                    } else {
                        console.log(rencanaKontrol.response);
                        let mapRencana = rencanaKontrol.response.list.filter(item => item.tglRencanaKontrol == element.tgl_registrasi);
                        if (mapRencana.length == 0) {
                            jeniskunjungan = 2;
                            noRef = `Y/${element.no_rawat}`
                        } else {
                            noRef = mapRencana[0].noSuratKontrol
                        }
                    }


                }
            }


            let jadwalDr = await getjadwaldokter(element.maping_poli_bpjs.kd_poli_bpjs, date);
            if (jadwalDr.metadata.code == 201) {
                console.log("Tidak ada jadwal dokter");
                continue;
            }
            let jadwals = jadwalDr.response.find((item) => item.kodedokter == element.maping_dokter_dpjpvclaim.kd_dokter_bpjs);
            let estimasidilayani = convmils(`${element.tgl_registrasi} ${element.jam_reg}`, 30);
            let data = {
                kodebooking: element.no_rawat,
                jenispasien: jenispasien,
                nomorkartu: element.pasien.no_peserta,
                nik: element.pasien.no_ktp,
                nohp: element.pasien.no_tlp,
                kodepoli: element.maping_poli_bpjs.kd_poli_bpjs,
                namapoli: element.maping_poli_bpjs.nm_poli_bpjs,
                pasienbaru: element.stts_daftar == "Baru" ? 1 : 0,
                norm: element.no_rkm_medis,
                tanggalperiksa: element.tgl_registrasi,
                kodedokter: element.maping_dokter_dpjpvclaim.kd_dokter_bpjs,
                namadokter: element.maping_dokter_dpjpvclaim.nm_dokter_bpjs,
                jampraktek: jadwals.jadwal || "-",
                jeniskunjungan: jeniskunjungan,
                nomorreferensi: noRef,
                nomorantrean: `${element.maping_poli_bpjs.kd_poli_bpjs}-${element.no_reg}`,
                angkaantrean: parseInt(element.no_reg),
                estimasidilayani: estimasidilayani,
                sisakuotajkn: (jadwals.kapasitaspasien - parseInt(element.no_reg)),
                kuotajkn: jadwals.kapasitaspasien,
                sisakuotanonjkn: (jadwals.kapasitaspasien - parseInt(element.no_reg)),
                kuotanonjkn: jadwals.kapasitaspasien,
                keterangan: "Peserta harap 20 menit lebih awal guna pencatatan administrasi."
            };
            console.log(data);
            let tambah = await addAntrean(data);
            if (tambah.metadata.message == 'Data dokter tidak ditemukan.') {
                continue;
            }
            if (tambah.metadata.message == 'Rujukan tidak valid') {
                data.jeniskunjungan = 2;
                tambah = await addAntrean(data);
            }
            if (tambah.metadata.message == 'data nohp  belum sesuai.') {
                data.nohp = '000000000000';
                tambah = await addAntrean(data);
            }
            if (tambah.metadata.message == 'data nik  belum sesuai.') {
                data.nik = '0000000000000000';
                tambah = await addAntrean(data);
            }
            if (tambah.metadata.code == 201) {
                data.jeniskunjungan = 2;
                tambah = await addAntrean(data);
            }
            console.log(tambah);
        } catch (error) {
            console.log(error);
            continue;
        }
    }
    let mapsregBooking = regBooking.map((item) => item.no_rawat);
    if (res.metadata.code == 200) {
        let findJKN = res.response.filter((item) => item.ispeserta === true);
        console.log("JKN " + findJKN.length);
    }
    console.log(mapsregBooking);
    console.log("Belum " + mapsregBooking.length);
    console.log("sudah " + kodebooking.length);
    return;
}

// Run the queue addition function with the current date
(async () => {
    try {
        await tambahAntrean(new Date().toISOString().split('T')[0]);
        await selesaikanManual(new Date().toISOString().split('T')[0]);
        // await selesaikanManual('2026-08-19');
        // await tambahAntrean(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
        console.log('Queue processing completed.' + new Date().toISOString().split('T')[0]);
        return;
    } catch (err) {
        console.error('Error during queue processing:', err);
    }
})();

