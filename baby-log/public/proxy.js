const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8899;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log('REQ:', req.method, req.url);
  if (req.url.startsWith('/proxy/')) {
    const targetPath = req.url.slice(7);
    const targetHost = 'open.feishu.cn';
    
    const options = {
      hostname: targetHost,
      path: '/' + targetPath,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    req.pipe(proxyReq);
    proxyReq.on('error', (e) => {
      res.writeHead(500);
      res.end('Proxy error: ' + e.message);
    });
  } else {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Proxy server running on port ' + PORT);
});
