import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import os from 'os';
import { Config } from './types.js';
import { getSupercraftDir, fileExists, ensureDir } from './filesystem.js';

const CONFIG_FILE = 'config.yaml';

export function getGlobalConfigDir(): string {
  return path.join(os.homedir(), '.supercraft');
}

export function getGlobalConfigPath(): string {
  return path.join(getGlobalConfigDir(), CONFIG_FILE);
}

export function getProjectConfigPath(): string {
  return path.join(getSupercraftDir(), CONFIG_FILE);
}

export function loadGlobalConfig(): Config | null {
  const configPath = getGlobalConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(content) as Config;
    if (!config || !config.project) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

export function loadProjectConfig(): Config | null {
  const configPath = getProjectConfigPath();
  if (!fileExists(configPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(content) as Config;
    if (!config || !config.project) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

export function mergeConfigs(global: Config | null, project: Config | null): Config {
  const projectVerif = project?.verification;
  const globalVerif = global?.verification;
  const hasProjectVerif = projectVerif && projectVerif.commands && projectVerif.commands.length > 0;
  const hasGlobalVerif = globalVerif && globalVerif.commands && globalVerif.commands.length > 0;

  return {
    project: project?.project || global?.project || { name: 'unknown' },
    verification: hasProjectVerif ? projectVerif : (hasGlobalVerif ? globalVerif : undefined)
  };
}

export function loadConfig(): Config {
  const global = loadGlobalConfig();
  const project = loadProjectConfig();
  return mergeConfigs(global, project);
}

export function saveProjectConfig(config: Config): void {
  const supercraftDir = getSupercraftDir();
  ensureDir(supercraftDir);
  const configPath = getProjectConfigPath();
  const content = yaml.stringify(config);
  fs.writeFileSync(configPath, content, 'utf-8');
}

export function saveGlobalConfig(config: Config): void {
  const configDir = getGlobalConfigDir();
  ensureDir(configDir);
  const configPath = getGlobalConfigPath();
  const content = yaml.stringify(config);
  fs.writeFileSync(configPath, content, 'utf-8');
}

export function getDefaultValue(key: string): string | undefined {
  const defaults: Record<string, string> = {
    'project.name': 'my-project'
  };
  return defaults[key];
}
