import { accessSync, constants, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';

interface ConfigDirectoryInfo {
  directory: string;
  usedFallback: boolean;
}

const DEFAULT_CONFIG_DIRECTORY = process.env.CONFIG_DIRECTORY
  ? path.resolve(process.env.CONFIG_DIRECTORY)
  : path.join(__dirname, '../../config');

const FALLBACK_CONFIG_DIRECTORY = path.join(
  os.tmpdir(),
  'jellyseerr',
  'config'
);

let cachedConfigDirectory: ConfigDirectoryInfo | null = null;

const ensureWritableDirectory = (directory: string): boolean => {
  try {
    mkdirSync(directory, { recursive: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code && code !== 'EEXIST') {
      if (code === 'EACCES') {
        return false;
      }

      throw error;
    }
  }

  try {
    accessSync(directory, constants.W_OK);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === 'EACCES') {
      return false;
    }

    throw error;
  }
};

export const resolveConfigDirectory = (): ConfigDirectoryInfo => {
  if (cachedConfigDirectory) {
    return cachedConfigDirectory;
  }

  if (ensureWritableDirectory(DEFAULT_CONFIG_DIRECTORY)) {
    cachedConfigDirectory = {
      directory: DEFAULT_CONFIG_DIRECTORY,
      usedFallback: false,
    };

    return cachedConfigDirectory;
  }

  if (!ensureWritableDirectory(FALLBACK_CONFIG_DIRECTORY)) {
    throw new Error('Fallback config directory is not writable.');
  }

  // eslint-disable-next-line no-console
  console.warn(
    `Config directory "${DEFAULT_CONFIG_DIRECTORY}" is not writable. Falling back to "${FALLBACK_CONFIG_DIRECTORY}".`
  );

  cachedConfigDirectory = {
    directory: FALLBACK_CONFIG_DIRECTORY,
    usedFallback: true,
  };

  return cachedConfigDirectory;
};

export const getConfigDirectory = (): string => {
  return resolveConfigDirectory().directory;
};

export const getDefaultConfigDirectory = (): string => {
  return DEFAULT_CONFIG_DIRECTORY;
};

export const resolveConfigPath = (...segments: string[]): string => {
  return path.join(getConfigDirectory(), ...segments);
};

export const configDirectoryUsesFallback = (): boolean => {
  return resolveConfigDirectory().usedFallback;
};

