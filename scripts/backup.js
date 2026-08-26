import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = String(Number(process.env.DB_PORT || 3306));
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME || 'house_rental';

function logSafe(message) {
  console.log(`[BACKUP] ${message}`);
}

function logError(message) {
  console.error(`[BACKUP] ${message}`);
}

function validateConfig() {
  if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
    logError('Missing required DB environment variables: DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
  }
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logSafe(`Created backup directory: ${BACKUP_DIR}`);
  }
}

function getBackupFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backup-${DB_NAME}-${timestamp}.sql.gz`;
}

async function createBackup() {
  validateConfig();
  ensureBackupDir();

  const backupFile = path.join(BACKUP_DIR, getBackupFileName());
  logSafe(`Starting backup: ${backupFile}`);

  return new Promise((resolve, reject) => {
    const args = [
      '--host=' + DB_HOST,
      '--port=' + DB_PORT,
      '--user=' + DB_USER,
      '--password=' + DB_PASSWORD,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--add-drop-table',
      '--add-drop-trigger',
      '--create-options',
      '--extended-insert',
      '--disable-keys',
      '--lock-tables=false',
      '--default-character-set=utf8mb4',
      '--comments',
      DB_NAME
    ];

    const mysqldump = spawn('mysqldump', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const gzip = spawn('gzip', ['-c'], { stdio: ['pipe', 'pipe', 'pipe'] });
    const writeStream = fs.createWriteStream(backupFile);

    mysqldump.stdout.pipe(gzip.stdin);
    gzip.stdout.pipe(writeStream);

    let mysqldumpStderr = '';
    mysqldump.stderr.on('data', (data) => {
      mysqldumpStderr += data.toString();
    });

    writeStream.on('finish', () => {
      if (mysqldumpStderr && !mysqldumpStderr.includes('Using a password')) {
        logError(`mysqldump warning: ${mysqldumpStderr.trim()}`);
      }
      logSafe(`Backup completed: ${backupFile}`);
      resolve(backupFile);
    });

    writeStream.on('error', (err) => {
      logError(`Write stream error: ${err.message}`);
      reject(err);
    });

    mysqldump.on('error', (err) => {
      logError(`mysqldump spawn error: ${err.message}`);
      reject(err);
    });

    mysqldump.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`mysqldump failed with exit code ${code}`);
        error.stderr = mysqldumpStderr;
        reject(error);
      }
    });
  });
}

async function cleanOldBackups() {
  logSafe(`Cleaning backups older than ${RETENTION_DAYS} days`);
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    if (deleted > 0) {
      logSafe(`Removed ${deleted} old backup(s)`);
    } else {
      logSafe('No old backups to remove');
    }
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

async function main() {
  try {
    await createBackup();
    await cleanOldBackups();
    process.exit(0);
  } catch (error) {
    logError(`Backup failed: ${error.message}`);
    if (error.stderr) {
      logError(`Details: ${error.stderr}`);
    }
    process.exit(1);
  }
}

main();
