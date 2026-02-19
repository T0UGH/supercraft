import { Command } from 'commander';
import path from 'path';
import { ensureDir, writeFile, fileExists, getSupercraftDir, getProjectRoot } from '../../core/filesystem.js';
import { loadState, saveState, saveSnapshot } from '../../core/state.js';

const DEFAULT_CONFIG = `# Supercraft 项目配置

project:
  name: my-project

verification:
  commands:
    - npm test
`;

const DEFAULT_STATE = `version: "1.0"
project:
  name: my-project
  root: /path/to/project

current: {}

tasks: []

metrics:
  total_tasks: 0
  completed: 0
  in_progress: 0
  pending: 0
  blocked: 0
  progress_percent: 0

metadata:
  created_at: "${new Date().toISOString()}"
  updated_at: "${new Date().toISOString()}"
`;

const DEFAULT_SPEC = `# 编码规范

这是一个示例规范文件。你可以在 .supercraft/specs/ 目录下添加自己的规范。

## 命名约定

- 变量使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 类和组件使用 PascalCase

## 代码风格

- 使用 2 空格缩进
- 使用单引号
- 语句末尾不加分号
`;

const DEFAULT_DESIGN_TEMPLATE = `# {title} 设计文档

> **创建时间**: {date}
> **状态**: 草稿

## 1. 概述

### 1.1 背景
[请描述背景]

### 1.2 目标
[请描述目标]

## 2. 技术方案

### 2.1 架构设计
[请描述架构]

### 2.2 数据流
[请描述数据流]

## 3. 实施计划
[待补充]
`;

const DEFAULT_PLAN_TEMPLATE = `# {title} 实施计划

> **创建时间**: {date}
> **状态**: 待开始

## 概述
[请描述任务概述]

## 任务列表

### Task 1: [任务名称]
- **文件**: [涉及的文件]
- **描述**: [任务描述]

## 验收标准
- [ ] [验收条件]
`;

export const initCommand = new Command('init')
  .description('初始化项目（创建 .supercraft/ 目录）')
  .action(() => {
    const supercraftDir = getSupercraftDir();
    const projectRoot = getProjectRoot();

    // 检查是否已初始化
    if (fileExists(supercraftDir)) {
      console.log('✓ 项目已初始化');
      console.log(`  目录: ${supercraftDir}`);
      return;
    }

    console.log('正在初始化 supercraft...');

    // 创建目录结构
    ensureDir(supercraftDir);
    ensureDir(path.join(supercraftDir, 'history'));
    ensureDir(path.join(supercraftDir, 'specs'));
    ensureDir(path.join(supercraftDir, 'templates'));

    // 创建配置文件
    writeFile(path.join(supercraftDir, 'config.yaml'), DEFAULT_CONFIG);
    writeFile(path.join(supercraftDir, 'state.yaml'), DEFAULT_STATE);
    writeFile(path.join(supercraftDir, 'specs', 'coding-style.md'), DEFAULT_SPEC);
    writeFile(path.join(supercraftDir, 'templates', 'design-doc.md'), DEFAULT_DESIGN_TEMPLATE);
    writeFile(path.join(supercraftDir, 'templates', 'plan.md'), DEFAULT_PLAN_TEMPLATE);

    // 自动创建初始快照（设计文档要求：init 时创建快照）
    const state = loadState();
    if (state) {
      // 更新 state.yaml 中的 root 路径为实际项目路径
      state.project.root = projectRoot;
      saveState(state);
      saveSnapshot(state);
    }

    console.log('✓ 初始化完成');
    console.log(`  目录: ${supercraftDir}`);
    console.log('');
    console.log('创建的文件:');
    console.log('  .supercraft/config.yaml      - 项目配置');
    console.log('  .supercraft/state.yaml       - 任务状态');
    console.log('  .supercraft/specs/           - 用户规范');
    console.log('  .supercraft/templates/       - 文档模板');
    console.log('  .supercraft/history/         - 状态快照');
  });
