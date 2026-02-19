#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';

const program = new Command();

program
  .name('supercraft')
  .description('可定制的 AI 辅助开发工作流系统')
  .version('0.1.0');

// 注册命令
program.addCommand(initCommand);
program.addCommand(statusCommand);

program.parse();
