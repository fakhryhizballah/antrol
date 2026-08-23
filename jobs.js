const { referensi_mobilejkn_bpjs_taskid } = require('./models');
const {
    getAntrian,
    getlisttask
} = require('./controlers/antrol');
const { stringToDatetime } = require('./helpers');

async function simpanTaksId(date) {
    let dataAntrian = await getAntrian(date)
    if (dataAntrian.metadata.code !== 200) return;
    let dataSelesai = dataAntrian.response.filter(item => item.status == 'Selesai dilayani' && item.sumberdata == 'Bridging Antrean');
    let kdBoking = dataSelesai.map(item => item.kodebooking);
    for (const item of kdBoking) {
        let cekTaskId = await referensi_mobilejkn_bpjs_taskid.findOne({
            where: {
                no_rawat: item,
                taskid: 5
            }
        })
        if (!cekTaskId) {
            let dataTask = await getlisttask(item);
            console.log(dataTask);
            for (const taskId of dataTask.response) {
                console.log(taskId.wakturs);
                console.log(stringToDatetime(taskId.wakturs));
                try {
                    await referensi_mobilejkn_bpjs_taskid.create({
                        no_rawat: item,
                        taskid: taskId.taskid,
                        waktu: stringToDatetime(taskId.wakturs)
                    });
                } catch (error) {
                    console.error(error);
                    break;
                }
            }
        }

    }
    console.log("selesai " + date);
    return
}
simpanTaksId(new Date().toISOString().split('T')[0]);
// simpanTaksId("2026-08-19");