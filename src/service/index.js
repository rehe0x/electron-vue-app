/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-alert */
/* eslint-disable no-console */
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
// import { remote } from 'electron';
const async = require('async');
const superagent = require('superagent');
require('superagent-proxy')(superagent);

const schedule = require('node-schedule');

const fs = require('fs');

const {
  getUserAgent, xml2json, getXdl, getIP,
} = require('../common');

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

const getUid = () => {
  try {
    const j = fs.readFileSync(path.join(__user_config, '/data/user.json'));
    const { uid } = JSON.parse(j).serverresponse;
    if (uid === undefined || uid.length === 0) {
      throw new Error('请更换账号试试～～');
    }
    return uid;
  } catch (err) {
    errorAlert(err);
  }
  return null;
};

const getConfig = () => {
  try {
    const j = fs.readFileSync(path.join(__user_config, '/config.json'));
    return JSON.parse(j);
  } catch (err) {
    errorAlert(err);
    return null;
  }
};

const setConfig = (odds, float, time, refTime, status, username, password, url) => {
  try {
    const ob = {};
    ob.odds = odds;
    ob.float = float;
    ob.time = time;
    ob.refTime = refTime;
    ob.status = status;
    ob.username = username;
    ob.password = password;
    ob.url = url;
    fs.writeFileSync(path.join(__user_config, '/config.json'), JSON.stringify(ob));
  } catch (err) {
    errorAlert(err);
  }
  return null;
};

// eslint-disable-next-line max-len
const leagueObj = (GID, LEAGUE, TEAM_H, TEAM_C, RATIO_R, IOR_RC, IOR_RH, DATETIME, CDATE, ECID = null) => ({
  GID,
  LEAGUE,
  TEAM_H,
  TEAM_C,
  RATIO_R,
  IOR_RC,
  IOR_RH,
  DATETIME,
  CDATE,
  ECID,
});

const pushData = (data) => {
  let d = fs.readFileSync(path.join(__user_config, '/data/mon.json'));
  if (d && d.length === 0) {
    d = '[]';
  }
  const ad = JSON.parse(d);
  const i = ad.findIndex(item => item.GID === data.GID);
  const RC = +Number(data.IOR_RC).toFixed(2);
  const RH = +Number(data.IOR_RH).toFixed(2);
  if (i === -1) {
    const obj = leagueObj(
      data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
      RC, RH, data.DATETIME, new Date().getTime(),
    );
    const o1 = Object.assign({}, obj);
    const arr = [];
    arr.push(obj);
    o1.arr = arr;
    ad.push(o1);
  } else {
    ad[i].RATIO_R = data.RATIO_R;
    ad[i].IOR_RC = RC;
    ad[i].IOR_RH = RH;
    ad[i].CDATE = new Date().getTime();
    ad[i].arr.push(leagueObj(
      data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
      RC, RH, data.DATETIME, new Date().getTime(),
    ));
  }
  fs.writeFileSync(path.join(__user_config, '/data/mon.json'), JSON.stringify(ad));
  // eslint-disable-next-line no-undef
  setCurrent(data.GID);
};

const nodeQueue = async.queue((obj, callback) => {
  console.log(`nodeQueue==========:${new Date()}|${obj}`);
  const lsjArr = obj.lsjArr;
  const data = obj.data;
  const config = obj.config;
  const ctime = obj.ctime;
  lsjArr.forEach((element) => {
    const i = data.findIndex(item => item.GID === element.GID);
    // console.log(element.GID, i);
    if (i !== -1) {
      const item = data[i];
      const IOR_RC = element.IOR_RC;
      const IOR_RH = element.IOR_RH;
      const RATIO_R = element.RATIO_R;
      const RC = item.IOR_RC;
      const RH = item.IOR_RH;
      const RR = item.RATIO_R;
      const s1 = IOR_RC + IOR_RH;
      const s2 = RC + RH;

      if (element.status) {
        console.log(element.status, item.ECID, item.GID, IOR_RC, RC, IOR_RH, RH, RATIO_R, RR);
        if (IOR_RC !== RC || IOR_RH !== RH || RATIO_R !== RR) {
          // 加入
          element.IOR_RC = RC;
          element.IOR_RH = RH;
          element.RATIO_R = RR;
          pushData(item);
        }
      } else if ((ctime + (1000 * 60 * config.time)) > new Date().getTime()) {
        console.log(element.status, item.ECID, item.GID, IOR_RC, RC, IOR_RH, RH, RATIO_R, RR);
        if ((Math.abs(s1 - s2) >= config.float) || RATIO_R !== RR) {
          //  加入
          element.status = true;
          element.IOR_RC = RC;
          element.IOR_RH = RH;
          element.RATIO_R = RR;
          pushData(item);
        }
      } else {
        // 删除任务
        console.log('删除', item.GID);
        lsjArr.splice(lsjArr.findIndex(item1 => item1.GID === item.GID), 1);
      }
    } else {
      const x = data.findIndex(item => item.ECID === element.ECID);
      if (x !== -1) {
        // 变了
        console.log('变了', data[x].GID);
        pushData(data[x]);
        element.GID = data[x].GID;
        element.IOR_RC = RC;
        element.IOR_RH = RH;
        element.RATIO_R = RR;
      } else {
        console.log('没有了');
      }
    }
  });
  console.log(`nodeQueue==========關閉:${new Date()}|${obj}`);
  callback();
});

class Dao {
  constructor(proxyURL = null, proxyAuth = null) {
    this.proxyURL = proxyURL;
    this.proxyAuth = proxyAuth;
    this.agent = superagent.agent();
    this.baseHeader = baseHeader;
    this.baseHeader['User-Agent'] = getUserAgent();
  }

  login(username, password) {
    const config = getConfig();
    return this.agent
      .post(`${config.url}/transform.php`)
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
    const config = getConfig();
    return this.agent
      .post(`${config.url}/transform.php`)
      .send({
        p: 'get_league_list_All',
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

  leagueById(uid, lid, callback) {
    const config = getConfig();
    this.agent
      .post(`${config.url}/transform.php`)
      .send({
        langx: 'zh-cn',
        p: 'get_game_list',
        date: '0',
        gtype: 'ft',
        showtype: 'today',
        rtype: 'r',
        ltype: '3',
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
      .disableTLSCerts()
      .end((err, res) => {
        if (err) {
          console.log(err);
          return;
        }
        callback(res);
      });
  }

  leagueByIds(uid, lids, callback) {
    const config = getConfig();
    this.agent
      .post(`${config.url}/transform.php`)
      .send({
        langx: 'zh-cn',
        p: 'get_game_list',
        date: '0',
        gtype: 'ft',
        showtype: 'today',
        rtype: 'r',
        ltype: '3',
        lid: lids,
        action: 'clickCoupon',
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
      .disableTLSCerts()
      .end((err, res) => {
        if (err) {
          console.log(err);
          return;
        }
        callback(res);
      });
  }
}

class Service {
  constructor() {
    // const url = getXdl();
    // getIP(url.proxyURL, url.proxyAuth);
    this.dao = new Dao();
  }

  async timingLogin() {
    const config = getConfig();
    try {
      const r = await this.dao.login(config.username, config.password);
      const json = xml2json(r.text);
      fs.writeFileSync(path.join(__user_config, '/data/user.json'), JSON.stringify(json));
      return true;
    } catch (err) {
      return false;
    }
  }
  createScheduleJobLogin() {
    // eslint-disable-next-line no-unused-vars
    schedule.scheduleJob('timingLogin', '0 */60 * * * ?', (d, a) => {
      console.log(`timingLogin:${new Date()}`);
      this.timingLogin();
    });
  }

  async timingLeague() {
    try {
      const r = await this.dao.leagueAll(getUid());
      console.log(r);
      if (r.text === 'table id error') {
        return 0;
      }
      const json = xml2json(r.text);
      if (json.serverresponse.msg === 'doubleLogin') {
        return 0;
      }
      const list = [];
      if (!json.serverresponse.classifier) {
        return 0;
      }
      console.log(json);
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

      if (!json.serverresponse.coupons) {
        return 0;
      }
      const { coupon } = json.serverresponse.coupons;
      const lids = coupon[0].lid;

      fs.writeFileSync(path.join(__user_config, '/data/league.json'), JSON.stringify(list));
      fs.writeFileSync(path.join(__user_config, '/data/lids.json'), lids);
      return 1;
    } catch (err) {
      return 2;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  leagueObj(GID, LEAGUE, TEAM_H, TEAM_C, RATIO_R, IOR_RC, IOR_RH, DATETIME, CDATE, ECID = null) {
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
      ECID,
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
    let d = fs.readFileSync(path.join(__user_config, '/data/star.json'));
    if (d && d.length === 0) {
      d = '[]';
    }
    const ad = JSON.parse(d);
    const i = ad.findIndex(item => item.GID === data.GID);
    if (i === -1) {
      ad.push(data);
    }
    fs.writeFileSync(path.join(__user_config, '/data/star.json'), JSON.stringify(ad));
  }

  pushData(data) {
    let d = fs.readFileSync(path.join(__user_config, '/data/mon.json'));
    if (d && d.length === 0) {
      d = '[]';
    }
    const ad = JSON.parse(d);
    const i = ad.findIndex(item => item.GID === data.GID);
    const RC = +Number(data.IOR_RC).toFixed(2);
    const RH = +Number(data.IOR_RH).toFixed(2);
    if (i === -1) {
      const obj = this.leagueObj(
        data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
        RC, RH, data.DATETIME, new Date().getTime(),
      );
      const o1 = Object.assign({}, obj);
      const arr = [];
      arr.push(obj);
      o1.arr = arr;
      ad.push(o1);
    } else {
      ad[i].RATIO_R = data.RATIO_R;
      ad[i].IOR_RC = RC;
      ad[i].IOR_RH = RH;
      ad[i].CDATE = new Date().getTime();
      ad[i].arr.push(this.leagueObj(
        data.GID, data.LEAGUE, data.TEAM_H, data.TEAM_C, data.RATIO_R,
        RC, RH, data.DATETIME, new Date().getTime(),
      ));
    }
    fs.writeFileSync(path.join(__user_config, '/data/mon.json'), JSON.stringify(ad));
    // eslint-disable-next-line no-undef
    setCurrent(data.GID);
  }

  async getLeagueByLids(lids) {
    return new Promise(((resolve, reject) => {
      this.dao.leagueByIds(getUid(), lids, (data) => {
        const lsjArr = [];
        if (data.text === 'table id error') {
          console.log('table id error');
          return;
        }
        const json = xml2json(data.text);
        if (json.serverresponse.msg === 'doubleLogin') {
          console.log('not Login');
          return;
        }
        const { ec } = json.serverresponse;
        if (ec instanceof Array) {
          ec.forEach((item1) => {
            const RC = +Number(item1.game.IOR_RC).toFixed(2);
            const RH = +Number(item1.game.IOR_RH).toFixed(2);
            const obj = this.leagueObj(
              item1.game.GID, item1.game.LEAGUE, item1.game.TEAM_H,
              item1.game.TEAM_C, item1.game.RATIO_R,
              RC, RH, item1.game.DATETIME, new Date().getTime(), item1.game.ECID,
            );
            lsjArr.push(obj);
          });
        } else if (ec instanceof Object) {
          const RC = +Number(ec.game.IOR_RC).toFixed(2);
          const RH = +Number(ec.game.IOR_RH).toFixed(2);
          const obj = this.leagueObj(
            ec.game.GID, ec.game.LEAGUE, ec.game.TEAM_H, ec.game.TEAM_C, ec.game.RATIO_R,
            RC, RH, ec.game.DATETIME, new Date().getTime(), ec.game.ECID,
          );
          lsjArr.push(obj);
        }
        resolve(lsjArr);
      });
    }));
  }

  createScheduleJobs(time) {
    const config = getConfig();
    const ctime = new Date().getTime();

    const lsj = fs.readFileSync(path.join(__user_config, '/data/lsj.json'));
    if (lsj && lsj.length === 0) {
      return;
    }
    const lids = fs.readFileSync(path.join(__user_config, '/data/lids.json'));
    if (!lids) {
      return;
    }

    const lsjArr = JSON.parse(lsj);
    schedule.scheduleJob('createScheduleJobs', time, async () => {
      console.log(`createScheduleJobs==========:${new Date()}`);
      const data = await this.getLeagueByLids(lids);
      if (!data) {
        return;
      }
      nodeQueue.push({
        lsjArr, data, config, ctime,
      });
    });
  }

  createScheduleJob(name, time, lid, gid, IOR_RH, IOR_RC, RATIO_R) {
    const job = schedule.scheduledJobs[name];
    if (job) {
      return;
    }
    const config = getConfig();
    let ctime = new Date().getTime();

    schedule.scheduleJob(name, time, () => {
      console.log(`${name}==========:${new Date()}`);
      this.dao.leagueById(getUid(), lid, (data) => {
        if (data.text === 'table id error') {
          console.log('table id error');
          return;
        }
        const json = xml2json(data.text);
        if (json.serverresponse.msg === 'doubleLogin') {
          console.log('not Login');
          return;
        }
        let item = null;
        const { ec } = json.serverresponse;
        if (ec instanceof Array) {
          const i = ec.findIndex(item => item.game.GID === gid);
          if (i !== -1) {
            item = ec[i];
          }
        } else if (ec instanceof Object) {
          if (gid === ec.game.GID) {
            item = ec;
          }
        } else {
          console.log(name, '请求错误');
        }
        if (!item) {
          return;
        }
        const RC = +Number(item.game.IOR_RC).toFixed(2);
        const RH = +Number(item.game.IOR_RH).toFixed(2);
        const RR = item.game.RATIO_R;
        const s1 = IOR_RC + IOR_RH;
        const s2 = RC + RH;

        if (ctime === null) {
          console.log(name, item.game.GID, IOR_RC, RC, IOR_RH, RH, RATIO_R, RR);
          if (IOR_RC !== RC || IOR_RH !== RH || RATIO_R !== RR) {
            // 加入
            IOR_RC = RC;
            IOR_RH = RH;
            this.pushData(item.game);
          }
        } else if ((ctime + (1000 * 60 * config.time)) > new Date().getTime()) {
          console.log(name, item.game.GID, IOR_RC, RC, IOR_RH, RH, RATIO_R, RR);
          if ((Math.abs(s1 - s2) >= config.float) || RATIO_R !== RR) {
            //  加入
            ctime = null;
            IOR_RC = RC;
            IOR_RH = RH;
            this.pushData(item.game);
          }
        } else {
          // 删除任务
          console.log('删除任务', name);
          schedule.scheduledJobs[name].cancel();
        }
      });
    });
  }

  timingLeagueValids() {
    const config = getConfig();
    const lids = fs.readFileSync(path.join(__user_config, '/data/lids.json'));
    if (lids) {
      this.dao.leagueByIds(getUid(), lids, (data) => {
        if (data.text === 'table id error') {
          console.log('table id error');
          return;
        }
        const json = xml2json(data.text);
        if (json.serverresponse.msg === 'doubleLogin') {
          console.log('not Login');
          return;
        }
        const lsjArr = [];
        const { ec } = json.serverresponse;
        if (ec instanceof Array) {
          ec.forEach((item1) => {
            const RC = +Number(item1.game.IOR_RC).toFixed(2);
            const RH = +Number(item1.game.IOR_RH).toFixed(2);
            if ((RC + RH) > config.odds) {
              const obj = this.leagueObj(
                item1.game.GID, item1.game.LEAGUE, item1.game.TEAM_H,
                item1.game.TEAM_C, item1.game.RATIO_R,
                RC, RH, item1.game.DATETIME, new Date().getTime(), item1.game.ECID,
              );
              obj.status = false;
              lsjArr.push(obj);
            }
          });
        } else if (ec instanceof Object) {
          const RC = +Number(ec.game.IOR_RC).toFixed(2);
          const RH = +Number(ec.game.IOR_RH).toFixed(2);
          if ((RC + RH) > config.odds) {
            const obj = this.leagueObj(
              ec.game.GID, ec.game.LEAGUE, ec.game.TEAM_H, ec.game.TEAM_C, ec.game.RATIO_R,
              RC, RH, ec.game.DATETIME, new Date().getTime(), ec.game.ECID,
            );
            obj.status = false;
            lsjArr.push(obj);
          }
        }
        fs.writeFileSync(path.join(__user_config, '/data/lsj.json'), JSON.stringify(lsjArr));

        const r = Number(config.refTime) + 0;
        const time = `0/${r} * * * * ?`;
        this.createScheduleJobs(time);
      });
    }
  }

  timingLeagueValid() {
    const config = getConfig();
    const lj = fs.readFileSync(path.join(__user_config, '/data/league.json'));
    const ljs = JSON.parse(lj);
    // getUid();
    if (ljs) {
      ljs.forEach((item) => {
        this.dao.leagueById(getUid(), item.id, (data) => {
          if (data.text === 'table id error') {
            console.log('table id error');
            return;
          }
          const json = xml2json(data.text);
          if (json.serverresponse.msg === 'doubleLogin') {
            console.log('not Login');
            return;
          }
          const { ec } = json.serverresponse;
          if (ec instanceof Array) {
            ec.forEach((item1) => {
              const RC = +Number(item1.game.IOR_RC).toFixed(2);
              const RH = +Number(item1.game.IOR_RH).toFixed(2);
              const RR = item1.game.RATIO_R;
              if ((RC + RH) > config.odds) {
                const r = Number(config.refTime) + 0;
                const time = `0/${r} * * * * ?`;
                this.createScheduleJob(item1.game.GID, time, item.id, item1.game.GID, RH, RC, RR);
              }
            });
          } else if (ec instanceof Object) {
            const RC = +Number(ec.game.IOR_RC).toFixed(2);
            const RH = +Number(ec.game.IOR_RH).toFixed(2);
            const RR = ec.game.RATIO_R;
            if ((RC + RH) > config.odds) {
              const r = Number(config.refTime) + 0;
              const time = `0/${r} * * * * ?`;
              this.createScheduleJob(ec.game.GID, time, item.id, ec.game.GID, RH, RC, RR);
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
      const j = fs.readFileSync(path.join(__user_config, '/data/mon.json'));
      return JSON.parse(j);
    } catch (err) {
      errorAlert(err);
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getStarData() {
    try {
      const j = fs.readFileSync(path.join(__user_config, '/data/star.json'));
      return JSON.parse(j);
    } catch (err) {
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  del(data) {
    try {
      const j = fs.readFileSync(path.join(__user_config, '/data/mon.json'));
      const arr = JSON.parse(j);
      arr.splice(arr.findIndex(item => item.GID === data.GID), 1);
      fs.writeFileSync(path.join(__user_config, '/data/mon.json'), JSON.stringify(arr));
    } catch (err) {
      errorAlert(err);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  delStar(data) {
    try {
      const j = fs.readFileSync(path.join(__user_config, '/data/star.json'));
      const arr = JSON.parse(j);
      arr.splice(arr.findIndex(item => item.GID === data.GID), 1);
      fs.writeFileSync(path.join(__user_config, '/data/star.json'), JSON.stringify(arr));
    } catch (err) {
      errorAlert(err);
    }
  }
}

export { Service, getConfig, setConfig };

