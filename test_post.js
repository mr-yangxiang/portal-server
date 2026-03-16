const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/v1/profile/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 伪造个 token，或者看看我们能否直接走过去，因为 router 加了 jwt 中间件可能 401
    // 这个接口之前没排除，会走到鉴权
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(JSON.stringify({
  nickname: 'Test Bot',
  tech_tags: 'Vue3, Node.js'
}));
req.end();
