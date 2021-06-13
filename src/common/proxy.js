const crypto = require('crypto');

const getXdl = () => {
  const timestamp = parseInt((new Date().getTime() / 1000), 10);
  const orderno = 'ZF2021631519Lb3oB2';
  const secret = '0f1dc269dcd945dfb922b6b96f6a7c92';

  const plantext = `orderno=${orderno},secret=${secret},timestamp=${timestamp}`;
  const md5 = crypto.createHash('md5');
  md5.update(plantext);
  let sign = md5.digest('hex');
  sign = sign.toUpperCase();

  const options = {
    proxyURL: 'http://forward.xdaili.cn:80',
    proxyAuth: `sign=${sign}&orderno=${orderno}&timestamp=${timestamp}`,
  };
  return options;
};

module.exports = getXdl;
