/* eslint-disable no-console */
const superagent = require('superagent');

const baseHeader = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
  Host: 'api.ipify.org',
  'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
  'sec-ch-ua-mobile': '?0',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
};

const getIP = (proxyURL = null, proxyAuth = null) => {
  superagent
    .get('https://api.ipify.org')
    .proxy(proxyURL)
    .query({
      format: 'json',
    })
    .set({
      ...baseHeader,
      'Proxy-Authorization': proxyAuth,
    })
    .retry(3)
    .timeout({
      response: 50000,
      deadline: 50000,
    })
    .disableTLSCerts()
    .end((err, res) => {
      console.log(res.body);
    });
};

// eslint-disable-next-line import/prefer-default-export
export { getIP };

