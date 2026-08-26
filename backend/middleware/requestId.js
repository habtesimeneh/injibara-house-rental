import { randomBytes } from 'crypto';

export const generateRequestId = () => {
  return randomBytes(16).toString('hex');
};
