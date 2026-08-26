import http from 'http';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5003,
      path,
      method,
      headers: {
        'Accept': 'application/json',
      }
    };

    if (body && typeof body === 'object') {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (body && typeof body === 'object') {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function test() {
  console.log('Testing register endpoint...');
  
  const res = await request('POST', '/api/auth/register', {
    name: 'Test Landlord',
    email: `test${Date.now()}@example.com`,
    phone: `+251911${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    password: 'TestPass123!',
    role: 'Landlord',
    region: 'Injibara',
    city: 'Injibara'
  });
  
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
}

test().catch(console.error);
