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

const FALLBACK_DIRECTORY_NAME = 'jellyseerr';

const resolvePreferredFallbackRoot = (): string => {
  if (process.env.CONFIG_FALLBACK_DIRECTORY) {
    return path.resolve(process.env.CONFIG_FALLBACK_DIRECTORY);
  }

  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, FALLBACK_DIRECTORY_NAME);
  }

  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, FALLBACK_DIRECTORY_NAME);
  }

  const homeDirectory = os.homedir();

  if (homeDirectory) {
    return path.join(homeDirectory, '.config', FALLBACK_DIRECTORY_NAME);
  }

  return path.join(os.tmpdir(), FALLBACK_DIRECTORY_NAME);
};

const FALLBACK_CONFIG_DIRECTORIES: string[] = [
  process.env.CONFIG_FALLBACK_DIRECTORY
    ? path.resolve(process.env.CONFIG_FALLBACK_DIRECTORY)
    : path.join(resolvePreferredFallbackRoot(), 'config'),
  path.join(os.tmpdir(), FALLBACK_DIRECTORY_NAME, 'config'),
];

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

  // eslint-disable-next-line no-console
  console.warn(
    `Config directory "${DEFAULT_CONFIG_DIRECTORY}" is not writable. Attempting to use a fallback location.`
  );

  for (const fallbackDirectory of FALLBACK_CONFIG_DIRECTORIES) {
    if (ensureWritableDirectory(fallbackDirectory)) {
      if (fallbackDirectory !== FALLBACK_CONFIG_DIRECTORIES[0]) {
        // eslint-disable-next-line no-console
        console.warn(
          `Preferred fallback config directory "${FALLBACK_CONFIG_DIRECTORIES[0]}" is not writable. Falling back to legacy path "${fallbackDirectory}".`
        );
      }

      cachedConfigDirectory = {
        directory: fallbackDirectory,
        usedFallback: true,
      };

      return cachedConfigDirectory;
    }
  }

  throw new Error('Fallback config directory is not writable.');
};

export const getConfigDirectory = (): string => {
  return resolveConfigDirectory().directory;
};

export const getDefaultConfigDirectory = (): string => {
  return DEFAULT_CONFIG_DIRECTORY;
};

export const getFallbackConfigDirectories = (): string[] => {
  return [...FALLBACK_CONFIG_DIRECTORIES];
};

export const resolveConfigPath = (...segments: string[]): string => {
  return path.join(getConfigDirectory(), ...segments);
};

export const configDirectoryUsesFallback = (): boolean => {
  return resolveConfigDirectory().usedFallback;
};

