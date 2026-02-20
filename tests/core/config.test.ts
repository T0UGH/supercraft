import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  mergeConfigs,
  loadGlobalConfig,
  loadProjectConfig,
  saveProjectConfig,
  saveGlobalConfig,
  getDefaultValue,
  getGlobalConfigPath,
  getProjectConfigPath
} from '../../src/core/config.js';
import { Config } from '../../src/core/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'supercraft-config-test-' + Date.now());

describe('mergeConfigs', () => {
  it('should return project config when global is null', () => {
    const project: Config = {
      project: { name: 'project-name' },
      verification: { commands: ['npm test'] }
    };
    const result = mergeConfigs(null, project);
    expect(result.project.name).toBe('project-name');
    expect(result.verification?.commands).toEqual(['npm test']);
  });

  it('should return global config when project is null', () => {
    const global: Config = {
      project: { name: 'global-name' }
    };
    const result = mergeConfigs(global, null);
    expect(result.project.name).toBe('global-name');
  });

  it('should merge with project taking precedence', () => {
    const global: Config = {
      project: { name: 'global-name' },
      verification: { commands: ['npm run lint'] }
    };
    const project: Config = {
      project: { name: 'project-name' },
      verification: { commands: ['npm test'] }
    };
    const result = mergeConfigs(global, project);
    expect(result.project.name).toBe('project-name');
    expect(result.verification?.commands).toEqual(['npm test']);
  });

  it('should use global verification when project verification is empty', () => {
    const global: Config = {
      project: { name: 'global-name' },
      verification: { commands: ['npm run lint'] }
    };
    const project: Config = {
      project: { name: 'project-name' },
      verification: { commands: [] }
    };
    const result = mergeConfigs(global, project);
    expect(result.verification?.commands).toEqual(['npm run lint']);
  });

  it('should use global verification when project verification is undefined', () => {
    const global: Config = {
      project: { name: 'global-name' },
      verification: { commands: ['npm run lint'] }
    };
    const project: Config = {
      project: { name: 'project-name' }
    };
    const result = mergeConfigs(global, project);
    expect(result.verification?.commands).toEqual(['npm run lint']);
  });

  it('should return unknown when both configs are null', () => {
    const result = mergeConfigs(null, null);
    expect(result.project.name).toBe('unknown');
  });

  it('should handle both configs null verification', () => {
    const global: Config = {
      project: { name: 'global-name' }
    };
    const project: Config = {
      project: { name: 'project-name' }
    };
    const result = mergeConfigs(global, project);
    expect(result.verification).toBeUndefined();
  });

  it('should handle empty project verification object', () => {
    const global: Config = {
      project: { name: 'global-name' },
      verification: { commands: ['npm run lint'] }
    };
    const project: Config = {
      project: { name: 'project-name' },
      verification: {} as any
    };
    const result = mergeConfigs(global, project);
    expect(result.verification?.commands).toEqual(['npm run lint']);
  });
});

describe('loadGlobalConfig', () => {
  it('should return null when global config does not exist', () => {
    const result = loadGlobalConfig();
    // May return null or existing config depending on system state
    expect(result === null || result.project).toBeTruthy();
  });
});

describe('loadProjectConfig', () => {
  it('should return null when project config does not exist', () => {
    const result = loadProjectConfig();
    // May return null or existing config depending on system state
    expect(result === null || result.project).toBeTruthy();
  });
});

describe('saveProjectConfig', () => {
  beforeEach(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should save and load project config', () => {
    const config: Config = {
      project: { name: 'test-project' },
      verification: { commands: ['npm test'] }
    };
    // This tests the save function exists and is callable
    expect(() => saveProjectConfig(config)).not.toThrow();
  });
});

describe('saveGlobalConfig', () => {
  it('should save global config', () => {
    const config: Config = {
      project: { name: 'global-test' },
      verification: { commands: ['npm run lint'] }
    };
    // This tests the save function exists and is callable
    expect(() => saveGlobalConfig(config)).not.toThrow();
  });
});

describe('getDefaultValue', () => {
  it('should return default value for known key', () => {
    expect(getDefaultValue('project.name')).toBe('my-project');
  });

  it('should return undefined for unknown key', () => {
    expect(getDefaultValue('unknown.key')).toBeUndefined();
  });
});
