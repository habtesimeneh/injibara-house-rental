/*
|--------------------------------------------------------------------------
| Upload Directory
|--------------------------------------------------------------------------
|
| Single source of truth for where uploaded files are written and served
| from. Every multer storage config and the static file route must use
| this value, otherwise uploads are written to a directory that is never
| served (or to one the process cannot write to).
|
| Resolution order:
|   1. UPLOAD_DIR            (explicit override, e.g. a mounted volume)
|   2. <cwd>/uploads         (local development)
|   3. <os tmpdir>/injibara-house-rental-uploads
|                            (container fallback: /app is read-only in
|                             most container images, /tmp is writable)
|
| The directory is created only if a candidate is writable, so a read-only
| or missing parent directory falls through to the next candidate instead
| of crashing the process at startup.
|
*/

import fs from 'fs';
import os from 'os';
import path from 'path';

const TMP_UPLOAD_DIR_NAME =
  'injibara-house-rental-uploads';

const candidates = [
  process.env.UPLOAD_DIR,
  path.resolve(process.cwd(), 'uploads'),
  path.join(os.tmpdir(), TMP_UPLOAD_DIR_NAME)
].filter(Boolean);

function isUsableUploadDir(dir) {
  try {
    fs.mkdirSync(dir, {
      recursive: true
    });

    fs.accessSync(
      dir,
      fs.constants.W_OK
    );

    return true;
  } catch (error) {
    console.warn(
      `[UPLOADS] Skipping unusable directory "${dir}": ${
        error.code || error.message
      }`
    );

    return false;
  }
}

const resolvedUploadDir =
  candidates.find(isUsableUploadDir);

if (!resolvedUploadDir) {
  throw new Error(
    'Unable to resolve a writable uploads directory. Set UPLOAD_DIR to a writable path.'
  );
}

console.log(
  `[UPLOADS] Using directory: ${resolvedUploadDir}`
);

export const UPLOAD_DIR = resolvedUploadDir;

export default UPLOAD_DIR;
