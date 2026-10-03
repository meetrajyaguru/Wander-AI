const http = require('http');

const data = JSON.stringify({
  destination: 'Kyoto',
  startDate: '2026-04-01',
  endDate: '2026-04-07',
  budget: 2000,
  people: 2
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/plan-trip',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
