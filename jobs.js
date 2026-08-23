const { referensi_mobilejkn_bpjs_taskid } = require('./models');
const {
    getAntrian,
    getlisttask
} = require('./controlers/antrol');
const { stringToDatetime } = require('./helpers');

async function simpanTaksId(date) {
    let dataAntrian = await getAntrian(date)
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
                console.log(item);
                console.log(taskId.wakturs);
                console.log(stringToDatetime(taskId.wakturs));
                let simpanTaskId = await referensi_mobilejkn_bpjs_taskid.create({
                    no_rawat: item,
                    taskid: taskId.taskid,
                    waktu: stringToDatetime(taskId.wakturs)
                });
                // console.log(simpanTaskId);
            }
            // return
        }


    }

}
simpanTaksId(new Date().toISOString().split('T')[0]);