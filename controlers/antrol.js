require("dotenv").config();
const debug = process.env.DEBUG === 'true';
const { getRandomTimeInMillis, stringToEpoch } = require("../helpers");
const Bpjs = require('../helpers/bpjs');

// Helper to build headers for BPJS requests
const getHeaders = (data) => ({
    'X-cons-id': process.env['BPJS.X_cons_id'],
    'X-timestamp': data.timestamp,
    'X-signature': data.signature,
    'user_key': process.env['BPJS.user_key'],
    'Content-Type': 'application/json'
});

/**
 * Centralised request helper for BPJS API.
 * @param {string} endpoint - API endpoint path (e.g. '/antreanrs/...')
 * @param {object} options - fetch options (method, body, etc.)
 * @param {boolean} decrypt - whether to decrypt and decompress the response
 * @returns {Promise<object>} - parsed BPJS response
 */
async function bpjsRequest(endpoint, options = {}, decrypt = true) {
    const bpjs = new Bpjs();
    const data = bpjs.getSignature();
    const headers = getHeaders(data);
    const url = `${process.env['BPJS.URL']}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const bpjsRes = await response.json();
    if (bpjsRes.metadata.code !== 200) return bpjsRes;
    if (!decrypt) return bpjsRes;
    const key = data.X_cons_id + data.secretKey + data.timestamp;
    const decrypted = bpjs.stringDecrypt(key, bpjsRes.response);
    bpjsRes.response = JSON.parse(bpjs.decompress(decrypted));
    return bpjsRes;
}
async function bpjsRequestVclaim(endpoint, options = {}, decrypt = true) {
    const bpjs = new Bpjs();
    const data = bpjs.getSignature();
    const headers = getHeaders(data);
    const url = `${process.env['BPJS.URL']}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const bpjsRes = await response.json();
    if (bpjsRes.metaData.code !== '200') return bpjsRes;
    if (!decrypt) return bpjsRes;
    const key = data.X_cons_id + data.secretKey + data.timestamp;
    const decrypted = bpjs.stringDecrypt(key, bpjsRes.response);
    bpjsRes.response = JSON.parse(bpjs.decompress(decrypted));
    return bpjsRes;
}
async function getAntrian(date) {
    const endpoint = `/antreanrs/antrean/pendaftaran/tanggal/${date}`;
    const bpjsRes = await bpjsRequest(endpoint, { method: 'GET' });
    return bpjsRes;
}
async function dashboard(date) {
    const endpoint = `/antreanrs/dashboard/waktutunggu/tanggal/${date}/waktu/rs`;
    const bpjsRes = await bpjsRequest(endpoint, { method: 'GET' });
    return bpjsRes;
}

async function getBelum() {
    const endpoint = '/antreanrs/antrean/pendaftaran/aktif';
    return await bpjsRequest(endpoint, { method: 'GET' });
}

async function getlisttask(kodebooking) {
    const endpoint = '/antreanrs/antrean/getlisttask';
    return await bpjsRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ kodebooking })
    });
}
async function kirimBatal(kodebooking, keterangan) {
    const endpoint = '/antreanrs/antrean/batal';
    return await bpjsRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ kodebooking, keterangan })
    });
}
async function updatewaktu(pesan) {
    const endpoint = '/antreanrs/antrean/updatewaktu';
    return await bpjsRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(pesan)
    });
}
async function addAntrean(data) {
    const endpoint = '/antreanrs/antrean/add';
    return await bpjsRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
async function getjadwaldokter(kd_poli_bpjs, date) {
    const endpoint = `/antreanrs/jadwaldokter/kodepoli/${kd_poli_bpjs}/tanggal/${date}`;
    const bpjsRes = await bpjsRequest(endpoint, { method: 'GET' });
    return bpjsRes;
}

async function getRujukanPCare(no_peserta) {
    const endpoint = `/vclaim-rest/Rujukan/Peserta/${no_peserta}`;
    const bpjsRes = await bpjsRequestVclaim(endpoint, { method: 'GET' });
    return bpjsRes;
}
async function getRujukanRS(no_peserta) {
    const endpoint = `/vclaim-rest/Rujukan/RS/Peserta/${no_peserta}`;
    const bpjsRes = await bpjsRequestVclaim(endpoint, { method: 'GET' });
    return bpjsRes;
}
async function getRencanaKontrol(Bulan, Tahun, no_peserta) {
    const endpoint = `/vclaim-rest/RencanaKontrol/ListRencanaKontrol/Bulan/${Bulan}/Tahun/${Tahun}/Nokartu/${no_peserta}/filter/2`;
    const bpjsRes = await bpjsRequestVclaim(endpoint, { method: 'GET' });
    return bpjsRes;
}
// getRencanaKontrol('08', '2026', '0003003587054');
// getRujukanPCare('0000051467128');
// getRujukanPCare('0000051467128');


// console.log('1786408986000' - getRandomTimeInMillis(2, 5));

// Export controller functions for external use (e.g., routes, tests)
module.exports = {
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
};