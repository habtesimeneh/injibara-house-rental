import 'dotenv/config';
import axios from 'axios';

async function testTextBee() {
  const apiKey = process.env.TEXTBEE_API_KEY?.trim();
  const deviceId = process.env.TEXTBEE_DEVICE_ID?.trim();
  const phone = '+251911000000';
  const code = '123456';
  const message = `[Injibara House Rental] Your Admin verification code is ${code}. It expires in 5 minutes. Do not share this code.`;

  console.log('API Key:', apiKey ? 'Set' : 'MISSING');
  console.log('Device ID:', deviceId ? 'Set' : 'MISSING');
  console.log('Phone:', phone);
  console.log('Message:', message);

  try {
    const response = await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        recipients: [phone],
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        timeout: 15000,
      }
    );
    console.log('TextBee response:', response.data);
  } catch (error) {
    console.error('TextBee error status:', error.response?.status);
    console.error('TextBee error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('TextBee error message:', error.message);
  } finally {
    process.exit(0);
  }
}

testTextBee();
