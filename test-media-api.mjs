import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5003';

function request(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);

    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      req.write(JSON.stringify(body));
    } else if (body) {
      req.write(body);
    }

    req.end();
  });
}

function log(test, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '✓' : '✗';
  console.log(`[${status}] ${icon} ${test}${detail ? ` - ${detail}` : ''}`);
  if (!passed) process.exitCode = 1;
}

async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await request('GET', '/api/houses');
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function runTests() {
  console.log('Starting server...');
  
  const projectRoot = 'C:\\Users\\Barok Simeneh\\OneDrive\\Desktop\\ZIP  website folder\\injibara-house';
  const server = spawn('node', ['backend/server.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '5003', NODE_ENV: 'development' },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Server running')) {
      console.log('Server started successfully');
    }
  });

  server.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Server running')) {
      console.log('Server started successfully');
    } else if (msg.includes('ValidationError')) {
      // Rate limiter IPv6 warning - ignore
    } else {
      console.error('Server stderr:', msg);
    }
  });

  const ready = await waitForServer();
  if (!ready) {
    console.error('Server failed to start');
    server.kill();
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('MEDIA MANAGEMENT API - END-TO-END TESTS');
  console.log('========================================\n');

  let authToken = null;
  let testHouseId = null;
  let testImageId = null;
  let testVideoId = null;

  // ==========================================
  // 1. UNAUTHENTICATED ACCESS
  // ==========================================
  console.log('--- Unauthenticated Access Tests ---');
  
  const unauthGetImages = await request('GET', '/api/houses/1/images');
  log('GET /api/houses/1/images without token rejected', unauthGetImages.status === 401, `status=${unauthGetImages.status}`);

  const unauthGetVideos = await request('GET', '/api/houses/1/videos');
  log('GET /api/houses/1/videos without token rejected', unauthGetVideos.status === 401, `status=${unauthGetVideos.status}`);

  const unauthPostImages = await request('POST', '/api/houses/1/images', {});
  log('POST /api/houses/1/images without token rejected', unauthPostImages.status === 401, `status=${unauthPostImages.status}`);

  const unauthDeleteImage = await request('DELETE', '/api/houses/images/999?houseId=1');
  log('DELETE /api/houses/images/999 without token rejected', unauthDeleteImage.status === 401, `status=${unauthDeleteImage.status}`);

  // ==========================================
  // 2. LANDLORD AUTH
  // ==========================================
  console.log('\n--- Landlord Auth Tests ---');
  
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const landlordEmail = `testlandlord${timestamp}${randomSuffix}@example.com`;
  const landlordPassword = 'TestPass123!';
  
  const registerRes = await request('POST', '/api/auth/register', {
    name: 'Test Landlord',
    email: landlordEmail,
    phone: `+251911${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
    password: landlordPassword,
    role: 'Landlord',
    region: 'Injibara',
    city: 'Injibara'
  });
  
  log('Register landlord', registerRes.status === 201 && registerRes.data?.success, `status=${registerRes.status}`);
  
  const loginRes = await request('POST', '/api/auth/login', {
    email: landlordEmail,
    password: landlordPassword
  });
  
  if (loginRes.status === 200 && loginRes.data?.success) {
    const cookies = loginRes.headers['set-cookie'] || [];
    for (const cookie of cookies) {
      if (cookie.startsWith('token=')) {
        authToken = cookie.split(';')[0].split('=')[1];
        break;
      }
    }
    console.log(`  Login successful, token: ${!!authToken}`);
  } else {
    console.log(`  Login failed: ${JSON.stringify(loginRes.data)}`);
  }
  
  log('Landlord login', !!authToken, `status=${loginRes.status}`);

  // ==========================================
  // 3. CREATE HOUSE WITH MULTIPLE IMAGES
  // ==========================================
  console.log('\n--- House Creation with Media Tests ---');
  
  if (!authToken) {
    console.log('  Skipping - no auth token');
  } else {
    const testDir = path.join(__dirname, 'test-media');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
      0x54, 0x01, 0xff, 0xd9
    ]);
    
    const testImage1 = path.join(testDir, 'test1.jpg');
    const testImage2 = path.join(testDir, 'test2.jpg');
    const testImage3 = path.join(testDir, 'test3.jpg');
    fs.writeFileSync(testImage1, jpegHeader);
    fs.writeFileSync(testImage2, jpegHeader);
    fs.writeFileSync(testImage3, jpegHeader);

    const boundary = '----FormBoundary' + Date.now();
    let bodyBuffer = '';
    const appendFile = (key, filePath) => {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      bodyBuffer += `--${boundary}\r\n`;
      bodyBuffer += `Content-Disposition: form-data; name="${key}"; filename="${fileName}"\r\n`;
      bodyBuffer += `Content-Type: image/jpeg\r\n\r\n`;
      bodyBuffer += fileBuffer.toString('binary') + '\r\n';
    };
    
    const appendField = (key, value) => {
      bodyBuffer += `--${boundary}\r\n`;
      bodyBuffer += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      bodyBuffer += value + '\r\n';
    };

    appendField('title', 'Test Media House');
    appendField('description', 'Testing media upload');
    appendField('type', 'Apartment');
    appendField('region', 'Injibara');
    appendField('city', 'Injibara');
    appendField('sub_city', 'Test');
    appendField('address', 'Test Address');
    appendField('price', '5000');
    appendField('rooms', '2');
    appendField('bathrooms', '1');
    appendField('square_meter', '80');
    appendFile('images', testImage1);
    appendFile('images', testImage2);
    appendFile('images', testImage3);
    bodyBuffer += `--${boundary}--\r\n`;

    const createHouseRes = await request('POST', '/api/houses', bodyBuffer, {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    });
    
    log('Create house with 3 images', 
        createHouseRes.status === 201 && createHouseRes.data?.success, 
        `status=${createHouseRes.status}`);
    
    if (createHouseRes.data?.success) {
      testHouseId = createHouseRes.data.data?.house_id;
      console.log(`  Created house ID: ${testHouseId}`);
    }

    // ==========================================
    // 4. VERIFY IMAGES
    // ==========================================
    console.log('\n--- Image Verification Tests ---');
    
    if (testHouseId) {
      const getImagesRes = await request('GET', `/api/houses/${testHouseId}/images`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      const images = getImagesRes.data?.data || [];
      log('GET house images returns array', 
          getImagesRes.status === 200 && Array.isArray(getImagesRes.data?.data), 
          `status=${getImagesRes.status}, count=${images.length}`);
      
      log('House has 3 images', images.length === 3, `count=${images.length}`);
      
      if (images.length > 0) {
        testImageId = images[0].image_id;
        log('First image is_primary=1', images[0].is_primary === 1, `is_primary=${images[0].is_primary}`);
        log('Images have display_order', images[0].display_order !== undefined, `display_order=${images[0].display_order}`);
        log('Image URLs stored correctly', images[0].image_url?.startsWith('/uploads/'), `url=${images[0].image_url}`);
      }

      // ==========================================
      // 5. TEST SET PRIMARY
      // ==========================================
      if (images.length >= 2) {
        const secondImageId = images[1].image_id;
        const setPrimaryRes = await request('PUT', `/api/houses/images/${secondImageId}?houseId=${testHouseId}`, 
          JSON.stringify({ is_primary: true }), {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          });
        
        log('Set second image as primary', 
            setPrimaryRes.status === 200 && setPrimaryRes.data?.success, 
            `status=${setPrimaryRes.status}`);
        
        if (setPrimaryRes.data?.success) {
          const verifyImagesRes = await request('GET', `/api/houses/${testHouseId}/images`, null, {
            'Authorization': `Bearer ${authToken}`
          });
          const updatedImages = verifyImagesRes.data?.data || [];
          const primaryCount = updatedImages.filter(img => img.is_primary === 1).length;
          log('Exactly 1 primary image after update', primaryCount === 1, `primary_count=${primaryCount}`);
        }
      }

      // ==========================================
      // 6. TEST DELETE IMAGE
      // ==========================================
      if (images.length > 0 && testImageId) {
        const deleteRes = await request('DELETE', `/api/houses/images/${testImageId}?houseId=${testHouseId}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        log('Delete image', deleteRes.status === 200 && deleteRes.data?.success, `status=${deleteRes.status}`);
        
        const afterDeleteRes = await request('GET', `/api/houses/${testHouseId}/images`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        const afterDeleteImages = afterDeleteRes.data?.data || [];
        log('Image count decreased', afterDeleteImages.length === images.length - 1, `count=${afterDeleteImages.length}`);
        
        const hasPrimary = afterDeleteImages.some(img => img.is_primary === 1);
        log('Primary auto-assigned after delete', hasPrimary, `hasPrimary=${hasPrimary}`);
      }

      // ==========================================
      // 7. TEST ADD MORE IMAGES
      // ==========================================
      const addMoreBody = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="test3.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
      const addMoreEnd = `\r\n--${boundary}--\r\n`;
      const addMoreBuffer = Buffer.concat([
        Buffer.from(addMoreBody, 'binary'),
        fs.readFileSync(testImage3),
        Buffer.from(addMoreEnd, 'binary')
      ]);
      
      const addMoreRes = await request('POST', `/api/houses/${testHouseId}/images`, addMoreBuffer, {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      });
      log('Add additional image', 
          addMoreRes.status === 201 && addMoreRes.data?.success, 
          `status=${addMoreRes.status}`);
    }

    // ==========================================
    // 8. VIDEO UPLOAD TESTS
    // ==========================================
    console.log('\n--- Video Upload Tests ---');
    
    const mp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      0x00, 0x00, 0x00, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x6d, 0x70, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    const testVideo = path.join(testDir, 'test.mp4');
    fs.writeFileSync(testVideo, mp4Header);
    
    if (testHouseId) {
      const vidBoundary = '----VideoBoundary' + Date.now();
      const vidBody = `--${vidBoundary}\r\nContent-Disposition: form-data; name="video"; filename="test.mp4"\r\nContent-Type: video/mp4\r\n\r\n`;
      const vidEnd = `\r\n--${vidBoundary}--\r\n`;
      const vidBuffer = Buffer.concat([
        Buffer.from(vidBody, 'binary'),
        fs.readFileSync(testVideo),
        Buffer.from(vidEnd, 'binary')
      ]);
      
      const videoRes = await request('POST', `/api/houses/${testHouseId}/videos`, vidBuffer, {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${vidBoundary}`
      });
      
      log('Upload video to house', 
          videoRes.status === 201 && videoRes.data?.success && videoRes.data.data?.video_url, 
          `status=${videoRes.status}`);
      
      if (videoRes.data?.success) {
        testVideoId = videoRes.data.data?.video_id;
        console.log(`  Created video ID: ${testVideoId}`);
      }

      const getVideosRes = await request('GET', `/api/houses/${testHouseId}/videos`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      log('GET house videos returns array', 
          getVideosRes.status === 200 && Array.isArray(getVideosRes.data?.data), 
          `status=${getVideosRes.status}, count=${getVideosRes.data?.data?.length || 0}`);

      if (testVideoId) {
        const deleteVideoRes = await request('DELETE', `/api/houses/videos/${testVideoId}?houseId=${testHouseId}`, null, {
          'Authorization': `Bearer ${authToken}`
        });
        log('Delete video', deleteVideoRes.status === 200 && deleteVideoRes.data?.success, `status=${deleteVideoRes.status}`);
      }
    }

    // ==========================================
    // 9. FILE VALIDATION TESTS
    // ==========================================
    console.log('\n--- File Validation Tests ---');
    
    if (testHouseId) {
      const textFile = path.join(testDir, 'test.txt');
      fs.writeFileSync(textFile, 'not an image');
      
      const txtBoundary = '----TxtBoundary' + Date.now();
      const txtBody = `--${txtBoundary}\r\nContent-Disposition: form-data; name="images"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\n`;
      const txtEnd = `\r\n--${txtBoundary}--\r\n`;
      const txtBuffer = Buffer.concat([
        Buffer.from(txtBody, 'binary'),
        fs.readFileSync(textFile),
        Buffer.from(txtEnd, 'binary')
      ]);
      
      const invalidTypeRes = await request('POST', `/api/houses/${testHouseId}/images`, txtBuffer, {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${txtBoundary}`
      });
      log('Invalid file type rejected', invalidTypeRes.status === 400, `status=${invalidTypeRes.status}`);
      
      const oversizedFile = path.join(testDir, 'oversized.jpg');
      const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 0xff);
      fs.writeFileSync(oversizedFile, oversizedBuffer);
      
      const overBoundary = '----OverBoundary' + Date.now();
      const overBody = `--${overBoundary}\r\nContent-Disposition: form-data; name="images"; filename="oversized.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
      const overEnd = `\r\n--${overBoundary}--\r\n`;
      const overBuffer = Buffer.concat([
        Buffer.from(overBody, 'binary'),
        fs.readFileSync(oversizedFile),
        Buffer.from(overEnd, 'binary')
      ]);
      
      const oversizedRes = await request('POST', `/api/houses/${testHouseId}/images`, overBuffer, {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${overBoundary}`
      });
      log('Oversized file rejected', oversizedRes.status === 400, `status=${oversizedRes.status}`);
    }

    // ==========================================
    // 10. CLEANUP
    // ==========================================
    console.log('\n--- Cleanup ---');
    
    if (testHouseId && authToken) {
      const deleteHouseRes = await request('DELETE', `/api/houses/${testHouseId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      log('Delete test house', deleteHouseRes.status === 200 && deleteHouseRes.data?.success, `status=${deleteHouseRes.status}`);
    }

    try {
      fs.rmSync(testDir, { recursive: true });
      console.log('  Test files cleaned up');
    } catch(e) {}
  }

  console.log('\n========================================');
  console.log('TESTS COMPLETE');
  console.log('========================================\n');

  server.kill('SIGTERM');
  setTimeout(() => server.kill('SIGKILL'), 2000);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
