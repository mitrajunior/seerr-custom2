import logger from '@server/logger';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const COMMIT_TAG_PATH = path.join(__dirname, '../../committag.json');
let commitTag = 'local';

if (existsSync(COMMIT_TAG_PATH)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fileCommitTag = require(COMMIT_TAG_PATH).commitTag;

  if (typeof fileCommitTag === 'string' && fileCommitTag.trim().length > 0) {
    commitTag = fileCommitTag;
    logger.info(`Commit Tag: ${commitTag}`);
  } else {
    logger.warn('Commit tag missing in committag.json; defaulting to local.');
  }
}

export const getCommitTag = (): string => {
  if (!shouldCheckForUpdates()) {
    return 'local';
  }

  return commitTag;
};

interface VersionOverrides {
  baseVersion?: string;
  suffix?: string;
  disableUpdateCheck?: boolean;
}

const CUSTOM_VERSION_PATH = path.resolve(process.cwd(), 'custom-version.json');

const parseBoolean = (value?: string): boolean | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
};

const loadFileOverrides = (): VersionOverrides => {
  if (!existsSync(CUSTOM_VERSION_PATH)) {
    return {};
  }

  try {
    const raw = readFileSync(CUSTOM_VERSION_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    const overrides: VersionOverrides = {};

    if (typeof parsed.baseVersion === 'string' && parsed.baseVersion.trim()) {
      overrides.baseVersion = parsed.baseVersion.trim();
    }

    if (typeof parsed.suffix === 'string') {
      overrides.suffix = parsed.suffix;
    }

    if (typeof parsed.disableUpdateCheck === 'boolean') {
      overrides.disableUpdateCheck = parsed.disableUpdateCheck;
    }

    return overrides;
  } catch (e) {
    logger.warn('Failed to load custom-version.json; falling back to defaults.', {
      label: 'AppVersion',
      errorMessage: (e as Error).message,
    });
    return {};
  }
};

const loadEnvOverrides = (): VersionOverrides => {
  const overrides: VersionOverrides = {};

  if (process.env.SEERR_VERSION_BASE?.trim()) {
    overrides.baseVersion = process.env.SEERR_VERSION_BASE.trim();
  }

  if (process.env.SEERR_VERSION_SUFFIX) {
    overrides.suffix = process.env.SEERR_VERSION_SUFFIX;
  }

  const disableUpdateCheck = parseBoolean(process.env.SEERR_DISABLE_UPDATE_CHECK);

  if (typeof disableUpdateCheck === 'boolean') {
    overrides.disableUpdateCheck = disableUpdateCheck;
  }

  return overrides;
};

const mergeOverrides = (
  defaults: Required<VersionOverrides>,
  fileOverrides: VersionOverrides,
  envOverrides: VersionOverrides
): Required<VersionOverrides> => {
  return {
    baseVersion: envOverrides.baseVersion ?? fileOverrides.baseVersion ?? defaults.baseVersion,
    suffix: envOverrides.suffix ?? fileOverrides.suffix ?? defaults.suffix,
    disableUpdateCheck:
      envOverrides.disableUpdateCheck ??
      fileOverrides.disableUpdateCheck ??
      defaults.disableUpdateCheck,
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: packageVersion } = require('../../package.json');

const defaultOverrides: Required<VersionOverrides> = {
  baseVersion: packageVersion,
  suffix: '',
  disableUpdateCheck: false,
};

const resolvedOverrides = mergeOverrides(
  defaultOverrides,
  loadFileOverrides(),
  loadEnvOverrides()
);

if (
  resolvedOverrides.baseVersion !== packageVersion ||
  resolvedOverrides.suffix ||
  resolvedOverrides.disableUpdateCheck
) {
  logger.info('Loaded custom version configuration', {
    label: 'AppVersion',
    baseVersion: resolvedOverrides.baseVersion,
    suffix: resolvedOverrides.suffix,
    disableUpdateCheck: resolvedOverrides.disableUpdateCheck,
  });
}

export const getAppBaseVersion = (): string => {
  return resolvedOverrides.baseVersion;
};

export const shouldCheckForUpdates = (): boolean => {
  return !resolvedOverrides.disableUpdateCheck;
};

export const getAppVersion = (): string => {
  const baseVersion = getAppBaseVersion();
  let finalVersion = baseVersion;

  if (baseVersion === '3.1.0') {
    finalVersion = `develop-${getCommitTag()}`;
  }

  if (resolvedOverrides.suffix) {
    finalVersion = `${finalVersion}${resolvedOverrides.suffix}`;
  }

  return finalVersion;
};
