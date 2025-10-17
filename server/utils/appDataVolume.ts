import { accessSync, constants, existsSync } from 'fs';
import path from 'path';

import {
  configDirectoryUsesFallback,
  getConfigDirectory,
  getDefaultConfigDirectory,
} from './configDirectory';

const CONFIG_PATH = getConfigDirectory();

const DOCKER_PATH = path.join(getDefaultConfigDirectory(), 'DOCKER');

export const appDataStatus = (): boolean => {
  return !existsSync(DOCKER_PATH);
};

export const appDataPath = (): string => {
  return CONFIG_PATH;
};

export const appDataPermissions = (): boolean => {
  try {
    accessSync(CONFIG_PATH, constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
};

export const appDataUsingFallback = (): boolean => {
  return configDirectoryUsesFallback();
};
