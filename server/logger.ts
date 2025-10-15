import path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

import { resolveLogDirectory } from './utils/logDirectory';

const hformat = winston.format.printf(
  ({ level, label, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]${
      label ? `[${label}]` : ''
    }: ${message} `;
    if (Object.keys(metadata).length > 0) {
      msg += JSON.stringify(metadata);
    }
    return msg;
  }
);

const { directory: logDirectory, usedFallback } = resolveLogDirectory({
  ensureExists: true,
  requireWrite: true,
});

if (usedFallback) {
  // eslint-disable-next-line no-console
  console.warn(`Log directory is not writable. Falling back to ${logDirectory}`);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL?.toLowerCase() || 'debug',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp(),
    hformat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.timestamp(),
        hformat
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDirectory, 'jellyseerr-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      createSymlink: true,
      symlinkName: 'jellyseerr.log',
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDirectory, '.machinelogs-%DATE%.json'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '1d',
      createSymlink: true,
      symlinkName: '.machinelogs.json',
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;
