import { accessSync, constants, mkdirSync } from 'fs';
import os from 'os';
import path from 'path';

interface ResolveLogDirectoryOptions {
  ensureExists?: boolean;
  requireWrite?: boolean;
}

interface ResolveLogDirectoryResult {
  directory: string;
  usedFallback: boolean;
}

const buildCandidateDirectories = (): string[] => {
  const candidates: string[] = [];

  if (process.env.CONFIG_DIRECTORY) {
    candidates.push(path.resolve(process.env.CONFIG_DIRECTORY, 'logs'));
  }

  candidates.push(path.resolve(process.cwd(), 'config', 'logs'));

  return candidates;
};

export const resolveLogDirectory = (
  options: ResolveLogDirectoryOptions = {}
): ResolveLogDirectoryResult => {
  const { ensureExists = false, requireWrite = false } = options;
  const candidates = buildCandidateDirectories();

  for (const directory of candidates) {
    try {
      if (ensureExists) {
        mkdirSync(directory, { recursive: true });
      }

      accessSync(
        directory,
        requireWrite ? constants.W_OK : constants.R_OK
      );

      return { directory, usedFallback: false };
    } catch (error) {
      // Continue to next candidate on failure
    }
  }

  const fallbackDirectory = path.join(os.tmpdir(), 'jellyseerr', 'logs');

  if (ensureExists) {
    mkdirSync(fallbackDirectory, { recursive: true });
  }

  accessSync(
    fallbackDirectory,
    requireWrite ? constants.W_OK : constants.R_OK
  );

  return { directory: fallbackDirectory, usedFallback: true };
};
