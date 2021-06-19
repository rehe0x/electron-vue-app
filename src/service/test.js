/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable indent */
const async = require('async');
const schedule = require('node-schedule');

// eslint-disable-next-line no-undef
const nodeQueue = async.queue((obj, callback) => {
    for (let index = 0; index < 20000; index++) {
        if (index === 19999 || index === 10000 || index === 5000) {
            console.log(index);
        }
    }
    console.log('完結');
    callback();
});

const data = { abc: '123', dd: '3' };
// const data1 = { abc: '1231', dd: '31' };
// nodeQueue.push({ data });
// console.log(data);
// nodeQueue.push({ data: data1 });
// console.log(data1);
// eslint-disable-next-line no-unused-vars
schedule.scheduleJob('test1', '0/1 * * * * ?', (d, a) => {
  console.log(`timingLogin1111:${new Date()}`);
  const t = new Date().getTime();
  console.log('hghs', data.abc);
  console.log('tttttttttttt', t);
  nodeQueue.push({ data, t });
});

