import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { loadState, saveState, saveSnapshot } from '../../core/state.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

const stateCommand = new Command('state')
  .description('状态管理');

// state snapshot 子命令
const snapshotCommand = new Command('snapshot')
  .description('创建当前状态快照')
  .action(() => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const snapshotPath = saveSnapshot(state);
    console.log(`✓ 快照已创建: ${snapshotPath}`);
  });

// state history 子命令
const historyCommand = new Command('history')
  .description('列出历史快照')
  .option('-n, --limit <number>', '显示数量', '10')
  .action((options) => {
    const historyDir = path.join(getSupercraftDir(), 'history');
    if (!fs.existsSync(historyDir)) {
      console.log('暂无历史快照');
      return;
    }

    const files = fs.readdirSync(historyDir)
      .filter(f => f.endsWith('.yaml'))
      .sort()
      .reverse()
      .slice(0, parseInt(options.limit));

    if (files.length === 0) {
      console.log('暂无历史快照');
      return;
    }

    console.log('\n历史快照:\n');
    for (const file of files) {
      const filePath = path.join(historyDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const snapshotState = yaml.parse(content);
      const metrics = snapshotState.metrics;
      console.log(`  ${file}`);
      console.log(`    任务: ${metrics.total_tasks} | 完成: ${metrics.completed} | 进度: ${metrics.progress_percent}%`);
    }
    console.log('');
  });

// state restore 子命令
const restoreCommand = new Command('restore')
  .description('恢复到指定快照')
  .argument('<file>', '快照文件名（在 history/ 目录下）')
  .action((filename) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const historyDir = path.join(getSupercraftDir(), 'history');
    const snapshotPath = path.join(historyDir, filename);

    if (!fs.existsSync(snapshotPath)) {
      console.log(`✗ 快照不存在: ${filename}`);
      console.log(`  运行 supercraft state history 查看可用快照`);
      return;
    }

    // 先保存当前状态为快照
    const currentState = loadState();
    if (currentState) {
      saveSnapshot(currentState);
      console.log('✓ 当前状态已备份');
    }

    // 恢复快照
    const content = fs.readFileSync(snapshotPath, 'utf-8');
    const restoredState = yaml.parse(content);
    saveState(restoredState);

    console.log(`✓ 已恢复快照: ${filename}`);
    console.log(`  任务数: ${restoredState.metrics.total_tasks}`);
    console.log(`  完成数: ${restoredState.metrics.completed}`);
    console.log(`  进度: ${restoredState.metrics.progress_percent}%`);
  });

stateCommand.addCommand(snapshotCommand);
stateCommand.addCommand(historyCommand);
stateCommand.addCommand(restoreCommand);

export { stateCommand };
