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

async function bpjsRequest(endpoint, options = {}, decrypt = true, metaKey = 'metadata') {
    const bpjs = new Bpjs();
    const data = bpjs.getSignature();
    const headers = getHeaders(data);
    const url = `${process.env['BPJS.URL']}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    const bpjsRes = await response.json();
    return bpjsRes;
}

async function getReferensiKamar() {
    const endpoint = `/aplicaresws/rest/ref/kelas`;
    const bpjsRes = await bpjsRequest(endpoint, { method: 'GET' });
    return bpjsRes;
}
async function ketersediaanKamarRS(start = 1, limit = 100) {
    const endpoint = `/aplicaresws/rest/bed/read/${process.env['BPJS.kodeppk']}/${start}/${limit}`;
    const bpjsRes = await bpjsRequest(endpoint, { method: 'GET' });
    return bpjsRes;
    
}
async function updateKamar(data) {
    const endpoint = `/aplicaresws/rest/bed/update/${process.env['BPJS.kodeppk']}`;
    return await bpjsRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
}

async function sirsUpdate(data) {

    const getHeaders = (data) => ({
        'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-rs-id': process.env["X-rs-id"],
        'X-Pass': process.env["X-Pass"],
        'Content-Type': 'application/json'
    });
    const headers = getHeaders(data);
    const response = await fetch("https://sirs.kemkes.go.id/fo/index.php/Fasyankes", { method: 'PUT', headers, body: JSON.stringify(data) });
    const bpjsRes = await response.json();
    console.log(bpjsRes)
    return bpjsRes

}

module.exports = { getReferensiKamar, ketersediaanKamarRS, updateKamar, sirsUpdate };