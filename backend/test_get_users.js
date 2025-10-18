const http = require('http');

const options = { hostname: 'localhost', port: 3000, path: '/users', method: 'GET' };
const req = http.request(options, res => {
  console.log('statusCode:', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', e => console.error(e));
req.end();
