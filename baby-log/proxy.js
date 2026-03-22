const http = require('http');
const https = require('https');

const PORT = 8899;

const FEISHU_API = 'open.feishu.cn';

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 把请求转发到飞书
  const options = {
    hostname: FEISHU_API,
    path: req.url,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy running on http://0.0.0.0:${PORT}`);
});
