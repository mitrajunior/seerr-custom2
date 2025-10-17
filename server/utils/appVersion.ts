import logger from '@server/logger';
import { existsSync } from 'fs';
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
  return commitTag;
};

export const getAppVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version } = require('../../package.json');

  let finalVersion = version;

  if (version === '0.1.0') {
    finalVersion = `develop-${getCommitTag()}`;
  }

  return finalVersion;
};
