import axios from "axios";

const MAX_SMS_LENGTH = 480;
const ETHIOPIAN_LOCAL_PHONE_PATTERN = /^09\d{8}$/;
const ETHIOPIAN_E164_PHONE_PATTERN = /^\+2519\d{8}$/;
const E164_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

export const normalizeSmsPhone = (phone) => {
  const normalized = String(phone || "").trim().replace(/[\s()-]/g, "");

  if (ETHIOPIAN_LOCAL_PHONE_PATTERN.test(normalized)) {
    return `+251${normalized.slice(1)}`;
  }

  if (ETHIOPIAN_E164_PHONE_PATTERN.test(normalized) || E164_PHONE_PATTERN.test(normalized)) {
    return normalized;
  }

  if (!normalized) {
    throw new Error("Invalid SMS recipient phone number");
  }

  throw new Error("Invalid SMS recipient phone number");
};

export const normalizeSmsMessage = (message) => {
  const normalized = String(message || "").trim();

  if (!normalized || normalized.length > MAX_SMS_LENGTH) {
    throw new Error(`SMS message must be between 1 and ${MAX_SMS_LENGTH} characters`);
  }

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    throw new Error("SMS message contains unsupported control characters");
  }

  return normalized;
};

export const sendSMS = async (recipients, message) => {
  const apiKey = process.env.TEXTBEE_API_KEY?.trim();
  const deviceId = process.env.TEXTBEE_DEVICE_ID?.trim();

  if (!apiKey) {
    throw new Error("TEXTBEE_API_KEY is missing");
  }

  if (!deviceId) {
    throw new Error("TEXTBEE_DEVICE_ID is missing");
  }

  const recipientList = Array.isArray(recipients)
    ? recipients
    : [recipients];

  const cleanedRecipients = recipientList.map(normalizeSmsPhone);

  if (cleanedRecipients.length === 0) {
    throw new Error("No SMS recipient provided");
  }

  const normalizedMessage = normalizeSmsMessage(message);

  try {
    const response = await axios.post(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        recipients: cleanedRecipients,
        message: normalizedMessage,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 15000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("[SMS] Provider request failed");

    throw new Error("TextBee SMS provider request failed");
  }
};
