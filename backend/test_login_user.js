const http = require('http');

const [,, emailArg, passArg] = process.argv;
const email = emailArg || 'newmod@example.com';
const password = passArg || 'NewMod@123';

const data = JSON.stringify({ email, password });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, res => {
  console.log('statusCode:', res.statusCode);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', d => { body += d; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json.token) {
        console.log('✅ Login OK. Token (truncated):', String(json.token).slice(0, 30) + '...');
        console.log('User:', json.user);
      } else {
        console.log('Response:', json);
      }
    } catch (_) {
      console.log(body);
    }
  });
});

req.on('error', error => {
  console.error('Request error:', error);
});

req.write(data);
req.end();
