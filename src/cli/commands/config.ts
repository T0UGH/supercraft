import { Command } from 'commander';
import {
  loadConfig,
  loadProjectConfig,
  loadGlobalConfig,
  saveProjectConfig,
  saveGlobalConfig,
  getDefaultValue
} from '../../core/config.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';
import { Config } from '../../core/types.js';

const configCommand = new Command('config')
  .description('配置管理');

// config list 子命令
const listCommand = new Command('list')
  .description('列出当前配置')
  .option('--global', '显示全局配置')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    let config: Config | null;

    if (options.global) {
      config = loadGlobalConfig();
      if (!config) {
        console.log('全局配置不存在');
        console.log('  创建: ~/.supercraft/config.yaml');
        return;
      }
    } else {
      if (!fileExists(getSupercraftDir())) {
        console.log('✗ 项目未初始化');
        console.log('  请先运行: supercraft init');
        return;
      }
      config = loadConfig();
    }

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    console.log('\n当前配置:\n');
    console.log(`  project.name: ${config.project.name}`);
    if (config.verification?.commands) {
      console.log(`  verification.commands:`);
      for (const cmd of config.verification.commands) {
        console.log(`    - ${cmd}`);
      }
    }
    console.log('');
  });

// config get 子命令
const getCommand = new Command('get')
  .description('获取配置项')
  .argument('<key>', '配置键名 (如 project.name)')
  .option('--global', '从全局配置获取')
  .action((key, options) => {
    let config: Config | null;

    if (options.global) {
      config = loadGlobalConfig();
    } else {
      if (!fileExists(getSupercraftDir())) {
        console.log('✗ 项目未初始化');
        return;
      }
      config = loadConfig();
    }

    if (!config) {
      console.log('配置不存在');
      return;
    }

    // 解析 key (如 "project.name")
    const parts = key.split('.');
    let value: unknown = config;
    for (const part of parts) {
      if (typeof value === 'object' && value !== null && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value === undefined) {
      value = getDefaultValue(key);
    }

    if (value === undefined) {
      console.log(`配置项不存在: ${key}`);
      return;
    }

    if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }
  });

// config set 子命令
const setCommand = new Command('set')
  .description('设置配置项')
  .argument('<key>', '配置键名')
  .argument('<value>', '配置值')
  .option('--global', '设置到全局配置')
  .action((key, value, options) => {
    let config: Config;

    if (options.global) {
      config = loadGlobalConfig() || { project: { name: 'unknown' } };
    } else {
      if (!fileExists(getSupercraftDir())) {
        console.log('✗ 项目未初始化');
        console.log('  请先运行: supercraft init');
        return;
      }
      config = loadProjectConfig() || { project: { name: 'unknown' } };
    }

    // 解析并设置值
    if (key === 'project.name') {
      config.project.name = value;
    } else if (key.startsWith('verification.commands')) {
      if (!config.verification) {
        config.verification = { commands: [] };
      }
      // 支持追加命令
      config.verification.commands.push(value);
    } else {
      console.log(`✗ 不支持的配置项: ${key}`);
      console.log('  支持的配置项:');
      console.log('    project.name');
      console.log('    verification.commands');
      return;
    }

    if (options.global) {
      saveGlobalConfig(config);
      console.log(`✓ 已更新全局配置: ${key} = ${value}`);
    } else {
      saveProjectConfig(config);
      console.log(`✓ 已更新项目配置: ${key} = ${value}`);
    }
  });

configCommand.addCommand(listCommand);
configCommand.addCommand(getCommand);
configCommand.addCommand(setCommand);

export { configCommand };
