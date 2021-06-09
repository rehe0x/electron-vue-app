/* eslint-disable no-console */
const superagent = require('superagent');
require('superagent-proxy')(superagent);

const schedule = require('node-schedule');

const fs = require('fs');
const { getUserAgent, xml2json } = require('../common');


const baseHeader = {
  Connection: 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'x-requested-with': 'XMLHttpRequest',
  Mobil: 'Safari/537.36',
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: '*/*',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Accept-Language': 'en,zh-CN;q=0.9,zh;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
};

class Dao {
  constructor(proxyURL = null, proxyAuth = null) {
    this.proxyURL = proxyURL;
    this.proxyAuth = proxyAuth;
    this.agent = superagent.agent();
    this.baseHeader = baseHeader;
    this.baseHeader['User-Agent'] = getUserAgent();
  }

  login(username, password) {
    return this.agent
      .post('https://m702.hga030.com/transform.php')
      .send({
        p: 'chk_login',
        langx: 'en-us',
        username,
        password,
        app: 'N',
        auto: 'GCADAZ',
      })
      .proxy(this.proxyURL)
      .set({
        ...this.baseHeader,
        'Proxy-Authorization': this.proxyAuth,
      })
      .retry(3)
      .timeout({
        response: 50000,
        deadline: 50000,
      })
      .disableTLSCerts();
  }

  leagueAll(uid) {
    return this.agent
      .post('https://m702.hga030.com/transform.php')
      .send({
        p: 'get_league_list_All',
        uid,
        langx: 'zh-cn',
        gtype: 'FT',
        FS: 'N',
        showtype: 'ft',
        date: '0',
        nocp: 'N',
      })
      .proxy(this.proxyURL)
      .set({
        ...this.baseHeader,
        'Proxy-Authorization': this.proxyAuth,
      })
      .retry(3)
      .timeout({
        response: 50000,
        deadline: 50000,
      })
      .disableTLSCerts();
  }

  leagueById(uid, lid) {
    return this.agent
      .post('https://m702.hga030.com/transform.php')
      .send({
        uid,
        langx: 'zh-cn',
        p: 'get_game_list',
        date: '0',
        gtype: 'ft',
        showtype: 'today',
        rtype: 'r',
        ltype: '4',
        lid,
        action: 'click_league',
        sorttype: 'L',
      })
      .proxy(this.proxyURL)
      .set({
        ...this.baseHeader,
        'Proxy-Authorization': this.proxyAuth,
      })
      .retry(3)
      .timeout({
        response: 50000,
        deadline: 50000,
      })
      .disableTLSCerts();
  }
}

const getUid = () => {
  try {
    const j = fs.readFileSync('src/data/user.json');
    const { uid } = JSON.parse(j).serverresponse;
    if (uid === undefined || uid.length === 0) {
      throw new Error('uid is null');
    }
    return uid;
  } catch (err) {
    console.log('user is null');
  }
  return null;
};

const getConfig = () => {
  try {
    const j = fs.readFileSync(`${__dirname}/static/config.json`);
    return JSON.parse(j);
  } catch (err) {
    console.log(err);
    return null;
  }
};

const setConfig = (odds, float, time, refTime, status, username, password) => {
  try {
    const ob = {};
    ob.odds = odds;
    ob.float = float;
    ob.time = time;
    ob.refTime = refTime;
    ob.status = status;
    ob.username = username;
    ob.password = password;
    fs.writeFileSync('src/config.json', JSON.stringify(ob));
  } catch (err) {
    console.log(err);
  }
  return null;
};

class Service {
  constructor() {
    this.dao = new Dao();
  }

  async timingLogin() {
    const config = getConfig();
    const r = await this.dao.login(config.username, config.password);
    const json = xml2json(r.text);
    fs.writeFileSync('src/data/user.json', JSON.stringify(json));
  }
  createScheduleJobLogin() {
    // eslint-disable-next-line no-unused-vars
    schedule.scheduleJob('timingLogin', '0 */60 * * * ?', (d, a) => {
      console.log(`timingLogin:${new Date()}`);
      this.timingLogin();
    });
  }

  async timingLeague() {
    const r = await this.dao.leagueAll(getUid());
    if (r.text === 'table id error') {
      return true;
    }
    const json = xml2json(r.text);
    if (json.serverresponse.msg === 'doubleLogin') {
      return true;
    }
    const list = [];
    if (!json.serverresponse.classifier) {
      return false;
    }
    const { region } = json.serverresponse.classifier;
    if (region instanceof Array) {
      region.forEach((item) => {
        const { league } = item;
        if (league instanceof Array) {
          league.forEach((item) => {
            list.push(item.$);
          });
        } else if (league instanceof Object) {
          list.push(league.$);
        }
      });
    } else if (region instanceof Object) {
      list.push(json.serverresponse.classifier.region.$);
    }
    fs.writeFileSync('src/data/league.json', JSON.stringify(list));
    return true;
  }

  async leagueByIdAsync(uid, id, callback) {
    const re = await this.dao.leagueById(uid, id);
    callback(re);
  }

  testS(a, b) {
    console.log(a, b);
    schedule.scheduleJob('testS', '*/2 * * * * ?', () => {
      console.log(a, b);
      console.log(`testS:${new Date()}`);
      console.log(`testS:${new Date()}`);
      a = '123';
      this.getUid();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  leagueObj(GID, LEAGUE, TEAM_H, TEAM_C, RATIO_R, IOR_RC, IOR_RH, DATETIME, CDATE) {
    return {
      GID,
      LEAGUE,
      TEAM_H,
      TEAM_C,
      RATIO_R,
      IOR_RC,
      IOR_RH,
      DATETIME,
      CDATE,
    };
    // console.log(ec.game.IOR_RH)
    // console.log(ec.game.IOR_RC)
    // RATIO_R //让球
    // DATETIME //时间
    // TEAM_H //主队
    // TEAM_C //客对
    // LEAGUE //联赛
  }

  // eslint-disable-next-line class-methods-use-this
  starData(data) {
    let d = fs.readFileSync('src/data/star.json');
    if (d && d.length === 0) {
      d = '[]';
    }
    const ad = JSON.parse(d);
    const i = ad.findIndex(item => item.GID === data.GID);
    if (i === -1) {
      ad.push(data);
    }
    fs.writeFileSync('src/data/star.json', JSON.stringify(ad));
  }

  pushData(data) {
    let d = fs.readFileSync('src/data/mon.json');
    if (d && d.length === 0) {
      d = '[]';
    }
    const ad = JSON.parse(d);
    const i = ad.findIndex(item => item.GID === data.GID);
    if (i === -1) {
      const obj = this.leagueObj(
        data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
        data.IOR_RC, data.IOR_RH, data.DATETIME, new Date().getTime(),
      );
      const o1 = Object.assign({}, obj);
      const arr = [];
      arr.push(obj);
      o1.arr = arr;
      ad[i].push(o1);
    } else {
      ad[i].RATIO_R = data.RATIO_R;
      ad[i].IOR_RC = data.IOR_RC;
      ad[i].IOR_RH = data.IOR_RH;
      ad[i].CDATE = new Date().getTime();
      ad[i].arr.push(this.leagueObj(
        data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
        data.IOR_RC, data.IOR_RH, data.DATETIME, new Date().getTime(),
      ));
    }
    fs.writeFileSync('src/data/mon.json', JSON.stringify(ad));
  }

  createScheduleJob(name, time, lid, gid, IOR_RH, IOR_RC) {
    const job = schedule.scheduledJobs[name];
    console.log('job========', schedule.scheduledJobs);
    if (job) {
      return;
    }
    const config = getConfig();
    let ctime = new Date().getTime();

    const j = schedule.scheduleJob(name, time, () => {
      console.log(`${name}==========:${new Date()}`);
      this.leagueByIdAsync(getUid(), lid, (data) => {
        if (data.text === 'table id error') {
          return;
        }
        const json = xml2json(data.text);
        if (json.serverresponse.msg === 'doubleLogin') {
          console.log('not Login');
          return;
        }
        const { ec } = json.serverresponse;
        if (ec instanceof Array) {
          ec.forEach((item) => {
            if (gid === item.game.GID) {
              const s1 = Number(IOR_RH) + Number(IOR_RC);
              const s2 = Number(item.game.IOR_RH) + Number(item.game.IOR_RC);
              if (Math.abs(s1 - s2) >= config.float) {
                if (ctime === null) {
                  // 加入
                  this.pushData(item.game);
                } else if ((ctime + (1000 * 60 * config.time)) > new Date().getTime()) {
                  //  加入
                  ctime = null;
                  this.pushData(item.game);
                } else {
                  // 删除任务
                  console.log('删除任务', name);
                  j.cancel();
                }
              }
            }
          });
        } else if (ec instanceof Object) {
          if (gid === ec.game.GID) {
            const s1 = Number(IOR_RH) + Number(IOR_RC);
            const s2 = Number(ec.game.IOR_RH) + Number(ec.game.IOR_RC);
            if (Math.abs(s1 - s2) >= config.float) {
              if (ctime === null) {
                // 加入
                this.pushData(ec.game);
              } else if ((ctime + (1000 * 60 * config.time)) > new Date().getTime()) {
                //  加入
                ctime = null;
                this.pushData(ec.game);
              } else {
                // 删除任务
                console.log('删除任务', name);
                j.cancel();
              }
            }
          }
        }
      });
    });
  }

  timingLeagueValid() {
    const config = getConfig();
    const lj = fs.readFileSync('src/data/league.json');
    const ljs = JSON.parse(lj);

    if (ljs) {
      ljs.forEach((item) => {
        this.leagueByIdAsync(getUid(), item.id, (data) => {
          if (data.text === 'table id error') {
            return;
          }
          const json = xml2json(data.text);
          console.log(json);
          if (json.serverresponse.msg === 'doubleLogin') {
            console.log('not Login');
            return;
          }
          const { ec } = json.serverresponse;
          if (ec instanceof Array) {
            ec.forEach((item1) => {
              if ((Number(item1.game.IOR_RH) + Number(item1.game.IOR_RC)) > config.odds) {
                console.log(item1);
                this.createScheduleJob(
                  item1.game.GID, `0/${config.refTime} * * * * ?`, item.id, item1.game.GID,
                  item1.game.IOR_RH, item1.game.IOR_RC,
                );
              }
            });
          } else if (ec instanceof Object) {
            if ((Number(ec.game.IOR_RH) + Number(ec.game.IOR_RC)) > config.odds) {
              console.log(ec);
              this.createScheduleJob(
                ec.game.GID, `0/${config.refTime} * * * * ?`, item.id,
                ec.game.GID, ec.game.IOR_RH, ec.game.IOR_RC,
              );
            }
          }
        });
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  cancelAll() {
    const jobs = schedule.scheduledJobs;
    Object.values(jobs).forEach((item) => {
      item.cancel();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getLeagueMon() {
    try {
      const j = fs.readFileSync('src/data/mon.json');
      return JSON.parse(j);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getStarData() {
    try {
      const j = fs.readFileSync('src/data/star.json');
      return JSON.parse(j);
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}

export { Service, getConfig, setConfig };

// const myDate = new Date();// 获取系统当前时间
// console.log(new Date().getTime());
// console.log(new Date().getTime() + (1000 * 60 * 30));
// console.log(Math.abs(-0.12));
// console.log(Math.abs(0.22));

// se.testS('4','1')
// se.timingLogin('caa112','bbaa1122')
// schedule.scheduleJob('timingLogin','0/1 * * * * ?',(d,a)=>{
//   console.log('timingLogin:' + new Date());
//   se.timingLogin('caa112','bbaa1122')
// });

// se.timingLeagueValid()

// schedule.scheduleJob('timingLeague','0 */1 * * * ?',()=>{
//    console.log('timingLeague:' + new Date());
//    se.timingLeague()
// });

// schedule.scheduleJob('timingLeagueValid','0 */1 * * * ?',()=>{
//    onsole.log('timingLeagueValid:' + new Date());
//    se.timingLeagueValid()
// });


// var all_jobs = schedule.scheduledJobs;
// console.log(all_jobs)
