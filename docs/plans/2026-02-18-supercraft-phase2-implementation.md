# Supercraft Phase 2 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 验证状态持久化 + AI 读写 + 技能使用状态

**Architecture:** 扩展 CLI 添加 task 和 state 命令组，实现状态 CRUD、快照和回退功能。添加 writing-plans 和 execute-plan 技能，这些技能通过调用 CLI 读写状态。

**Tech Stack:** TypeScript, Node.js, commander.js, yaml

---

## Task 1: task list 命令

**Files:**
- Create: `src/cli/commands/task.ts`

**Step 1: 创建 task 命令框架**

Create `src/cli/commands/task.ts`:

```typescript
import { Command } from 'commander';
import { loadState } from '../../core/state.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

const taskCommand = new Command('task')
  .description('任务管理');

// task list 子命令
const listCommand = new Command('list')
  .description('列出所有任务')
  .option('-s, --status <status>', '按状态筛选')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    let tasks = state.tasks;

    // 按状态筛选
    if (options.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
      if (!validStatuses.includes(options.status)) {
        console.log(`✗ 无效的状态: ${options.status}`);
        console.log(`  有效状态: ${validStatuses.join(', ')}`);
        return;
      }
      tasks = tasks.filter(t => t.status === options.status);
    }

    if (options.json) {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    if (tasks.length === 0) {
      console.log('暂无任务');
      return;
    }

    console.log('\n任务列表:\n');
    for (const task of tasks) {
      const statusIcon = {
        completed: '✓',
        in_progress: '●',
        pending: '○',
        blocked: '✗'
      }[task.status];
      const priorityIcon = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
      }[task.priority];
      console.log(`  ${statusIcon} ${priorityIcon} ${task.id}: ${task.title}`);
      if (task.description) {
        console.log(`      ${task.description}`);
      }
    }
    console.log('');
  });

taskCommand.addCommand(listCommand);

export { taskCommand };
```

**Step 2: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { taskCommand } from './commands/task.js';

const program = new Command();

program
  .name('supercraft')
  .description('可定制的 AI 辅助开发工作流系统')
  .version('0.1.0');

// 注册命令
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(taskCommand);

program.parse();
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js task list --help
```

Expected: 显示帮助信息

**Step 4: Commit**

```bash
git add src/cli/commands/task.ts src/cli/index.ts
git commit -m "feat: add task list command"
```

---

## Task 2: task show 命令

**Files:**
- Modify: `src/cli/commands/task.ts`

**Step 1: 添加 task show 子命令**

在 `src/cli/commands/task.ts` 中添加:

```typescript
// task show 子命令
const showCommand = new Command('show')
  .description('显示任务详情')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    const statusLabel = {
      completed: '已完成',
      in_progress: '进行中',
      pending: '待处理',
      blocked: '已阻塞'
    }[task.status];

    console.log(`\n任务: ${task.id}`);
    console.log(`标题: ${task.title}`);
    console.log(`状态: ${statusLabel}`);
    console.log(`优先级: ${task.priority}`);
    if (task.description) {
      console.log(`描述: ${task.description}`);
    }
    console.log(`创建时间: ${task.created_at}`);
    if (task.started_at) {
      console.log(`开始时间: ${task.started_at}`);
    }
    if (task.completed_at) {
      console.log(`完成时间: ${task.completed_at}`);
    }
    if (task.blocked_reason) {
      console.log(`阻塞原因: ${task.blocked_reason}`);
    }
    console.log('');
  });

taskCommand.addCommand(showCommand);
```

**Step 2: 编译并测试**

```bash
npm run build
node dist/cli/index.js task show --help
```

Expected: 显示帮助信息

**Step 3: Commit**

```bash
git add src/cli/commands/task.ts
git commit -m "feat: add task show command"
```

---

## Task 3: task create 命令

**Files:**
- Modify: `src/cli/commands/task.ts`
- Modify: `src/core/state.ts`

**Step 1: 添加 saveState 和 generateTaskId 函数**

在 `src/core/state.ts` 中添加:

```typescript
export function generateTaskId(tasks: Task[]): string {
  const existingIds = tasks.map(t => parseInt(t.id.replace('task-', ''))).filter(n => !isNaN(n));
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return `task-${maxId + 1}`;
}

export function createTask(title: string, description: string | undefined, priority: 'high' | 'medium' | 'low'): Task {
  return {
    id: '',
    title,
    description,
    status: 'pending',
    priority,
    created_at: new Date().toISOString()
  };
}
```

**Step 2: 添加 task create 子命令**

在 `src/cli/commands/task.ts` 中添加导入和命令:

```typescript
import { loadState, saveState, generateTaskId, createTask, calculateMetrics } from '../../core/state.js';
import { Task } from '../../core/types.js';

// task create 子命令
const createCommand = new Command('create')
  .description('创建新任务')
  .requiredOption('-t, --title <title>', '任务标题')
  .option('-d, --description <description>', '任务描述')
  .option('-p, --priority <priority>', '优先级 (high/medium/low)', 'medium')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(options.priority)) {
      console.log(`✗ 无效的优先级: ${options.priority}`);
      console.log(`  有效优先级: ${validPriorities.join(', ')}`);
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const newTask = createTask(
      options.title,
      options.description,
      options.priority
    );
    newTask.id = generateTaskId(state.tasks);

    state.tasks.push(newTask);
    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(newTask, null, 2));
      return;
    }

    console.log(`✓ 任务已创建: ${newTask.id}`);
    console.log(`  标题: ${newTask.title}`);
    console.log(`  优先级: ${newTask.priority}`);
  });

taskCommand.addCommand(createCommand);
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js task create --title "测试任务" --priority high
```

Expected: 任务创建成功

**Step 4: Commit**

```bash
git add src/cli/commands/task.ts src/core/state.ts
git commit -m "feat: add task create command"
```

---

## Task 4: task start 命令

**Files:**
- Modify: `src/cli/commands/task.ts`

**Step 1: 添加 task start 子命令**

在 `src/cli/commands/task.ts` 中添加:

```typescript
// task start 子命令
const startCommand = new Command('start')
  .description('开始执行任务')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已完成，无法再次开始`);
      return;
    }

    if (task.status === 'in_progress') {
      console.log(`✗ 任务已在进行中`);
      return;
    }

    // 创建快照（回退用）
    saveSnapshot(state);

    task.status = 'in_progress';
    task.started_at = new Date().toISOString();
    if (task.status === 'blocked') {
      task.blocked_reason = undefined;
    }

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已开始: ${task.id}`);
    console.log(`  标题: ${task.title}`);
  });

taskCommand.addCommand(startCommand);
```

**Step 2: 添加 saveSnapshot 辅助函数**

在 `src/core/state.ts` 中添加:

```typescript
import fs from 'fs';
import path from 'path';
import { getSupercraftDir } from './filesystem.js';

export function saveSnapshot(state: State): string {
  const historyDir = path.join(getSupercraftDir(), 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}.yaml`;
  const snapshotPath = path.join(historyDir, filename);

  const content = yaml.stringify(state);
  fs.writeFileSync(snapshotPath, content, 'utf-8');

  return snapshotPath;
}
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js task start task-1
```

Expected: 任务状态变为 in_progress

**Step 4: Commit**

```bash
git add src/cli/commands/task.ts src/core/state.ts
git commit -m "feat: add task start command with snapshot"
```

---

## Task 5: task complete 命令

**Files:**
- Modify: `src/cli/commands/task.ts`

**Step 1: 添加 task complete 子命令**

在 `src/cli/commands/task.ts` 中添加:

```typescript
// task complete 子命令
const completeCommand = new Command('complete')
  .description('标记任务完成')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已经完成`);
      return;
    }

    // 创建快照
    saveSnapshot(state);

    task.status = 'completed';
    task.completed_at = new Date().toISOString();

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已完成: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`\n进度: ${state.metrics.progress_percent}% (${state.metrics.completed}/${state.metrics.total_tasks})`);
  });

taskCommand.addCommand(completeCommand);
```

**Step 2: 编译并测试**

```bash
npm run build
node dist/cli/index.js task complete task-1
```

Expected: 任务状态变为 completed

**Step 3: Commit**

```bash
git add src/cli/commands/task.ts
git commit -m "feat: add task complete command"
```

---

## Task 6: task block 和 rollback 命令

**Files:**
- Modify: `src/cli/commands/task.ts`

**Step 1: 添加 task block 子命令**

在 `src/cli/commands/task.ts` 中添加:

```typescript
// task block 子命令
const blockCommand = new Command('block')
  .description('标记任务阻塞')
  .argument('<id>', '任务 ID')
  .argument('[reason]', '阻塞原因')
  .option('--json', 'JSON 格式输出')
  .action((id, reason, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已完成，无法阻塞`);
      return;
    }

    // 创建快照
    saveSnapshot(state);

    task.status = 'blocked';
    task.blocked_reason = reason || '未指定原因';

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✗ 任务已阻塞: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`  原因: ${task.blocked_reason}`);
  });

taskCommand.addCommand(blockCommand);
```

**Step 2: 添加 task rollback 子命令**

在 `src/cli/commands/task.ts` 中添加:

```typescript
// task rollback 子命令
const rollbackCommand = new Command('rollback')
  .description('回退任务到上一状态')
  .argument('<id>', '任务 ID')
  .option('--to <status>', '回退到指定状态')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    let targetStatus = options.to || getPreviousStatus(task.status);

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      console.log(`✗ 无法确定回退目标状态`);
      console.log(`  使用 --to 指定状态: ${validStatuses.join(', ')}`);
      return;
    }

    // 创建快照（回退前备份）
    saveSnapshot(state);

    task.status = targetStatus as Task['status'];
    if (targetStatus !== 'in_progress') {
      task.started_at = undefined;
    }
    if (targetStatus !== 'completed') {
      task.completed_at = undefined;
    }
    if (targetStatus !== 'blocked') {
      task.blocked_reason = undefined;
    }

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已回退: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`  新状态: ${targetStatus}`);
  });

function getPreviousStatus(currentStatus: string): string | null {
  const transitions: Record<string, string> = {
    'in_progress': 'pending',
    'completed': 'in_progress',
    'blocked': 'pending'
  };
  return transitions[currentStatus] || null;
}

taskCommand.addCommand(rollbackCommand);
```

**Step 3: 更新 types 导入**

确保 Task 类型已导入:

```typescript
import { Task } from '../../core/types.js';
```

**Step 4: 编译并测试**

```bash
npm run build
node dist/cli/index.js task block task-1 "等待依赖"
node dist/cli/index.js task rollback task-1
```

Expected: 任务状态正确变更

**Step 5: Commit**

```bash
git add src/cli/commands/task.ts
git commit -m "feat: add task block and rollback commands"
```

---

## Task 7: state 命令组

**Files:**
- Create: `src/cli/commands/state.ts`

**Step 1: 创建 state 命令**

Create `src/cli/commands/state.ts`:

```typescript
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
```

**Step 2: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { taskCommand } from './commands/task.js';
import { stateCommand } from './commands/state.js';

const program = new Command();

program
  .name('supercraft')
  .description('可定制的 AI 辅助开发工作流系统')
  .version('0.1.0');

// 注册命令
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(taskCommand);
program.addCommand(stateCommand);

program.parse();
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js state snapshot
node dist/cli/index.js state history
```

Expected: 快照功能正常工作

**Step 4: Commit**

```bash
git add src/cli/commands/state.ts src/cli/index.ts
git commit -m "feat: add state command group (snapshot, history, restore)"
```

---

## Task 8: writing-plans skill

**Files:**
- Create: `skills/writing-plans/SKILL.md`

**Step 1: 创建 skills 目录**

```bash
mkdir -p skills/writing-plans
```

**Step 2: 创建 SKILL.md**

Create `skills/writing-plans/SKILL.md`:

```markdown
---
name: writing-plans
description: "Use when you have a spec or requirements and need to create an implementation plan"
---

# Writing Plans: 编写实施计划

## 概述

根据设计文档或需求编写详细的实施计划，将大任务分解为可执行的小步骤。

## 前置步骤

1. **获取用户规范**（如果需要）：
   ```bash
   supercraft spec get coding-style
   ```

2. **创建计划文档**：
   ```bash
   supercraft template copy plan
   ```
   这会在 `docs/plans/` 目录创建一个计划文档副本。

## 工作流程

### 步骤 1: 理解需求

- 阅读设计文档
- 理解技术方案
- 确认约束条件

### 步骤 2: 分解任务

将任务分解为 2-5 分钟可完成的小步骤：

- 每个步骤是一个动作
- 包含精确的文件路径
- 包含完整的代码
- 包含验证命令

### 步骤 3: 创建任务到状态系统

```bash
# 创建任务
supercraft task create --title "实现用户认证" --description "JWT 认证系统" --priority high

# 查看任务
supercraft task list
```

### 步骤 4: 保存计划

- 保存到 `docs/plans/YYYY-MM-DD-<feature>.md`
- 提交到 git

## 任务模板

```markdown
### Task N: [任务名称]

**Files:**
- Create: `path/to/file.ts`
- Modify: `path/to/existing.ts:10-20`
- Test: `tests/path/test.ts`

**Step 1: 编写测试**

[测试代码]

**Step 2: 运行测试验证失败**

[命令和预期输出]

**Step 3: 实现最小代码**

[实现代码]

**Step 4: 运行测试验证通过**

[命令和预期输出]

**Step 5: Commit**

```bash
git add [files]
git commit -m "[message]"
```
```

## 关键原则

- **DRY** - 不要重复代码
- **YAGNI** - 只实现需要的功能
- **TDD** - 测试驱动开发
- **频繁提交** - 每个小步骤都提交

## 执行选项

完成计划后，提供两个执行选项：

1. **Subagent-Driven（当前会话）** - 使用 superpowers:subagent-driven-development
2. **Parallel Session（单独会话）** - 在新会话中使用 superpowers:executing-plans
```

**Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add writing-plans skill"
```

---

## Task 9: execute-plan skill

**Files:**
- Create: `skills/execute-plan/SKILL.md`

**Step 1: 创建 skills 目录**

```bash
mkdir -p skills/execute-plan
```

**Step 2: 创建 SKILL.md**

Create `skills/execute-plan/SKILL.md`:

```markdown
---
name: execute-plan
description: "Use when you have a written implementation plan to execute"
---

# Execute Plan: 执行实施计划

## 概述

执行已有的实施计划，逐任务完成开发工作。

## 前置步骤

1. **获取用户规范**：
   ```bash
   supercraft spec get coding-style
   ```
   遵循用户定义的编码规范。

2. **查看当前状态**：
   ```bash
   supercraft status
   supercraft task list
   ```

## 工作流程

### 步骤 1: 确认计划

- 确认要执行的计划文件
- 了解任务分解

### 步骤 2: 逐任务执行

对于每个任务：

1. **标记开始**：
   ```bash
   supercraft task start <task-id>
   ```

2. **执行步骤**：
   - 按计划中的步骤逐一执行
   - 确保每个步骤都通过验证

3. **标记完成**：
   ```bash
   supercraft task complete <task-id>
   ```

4. **如果遇到阻塞**：
   ```bash
   supercraft task block <task-id> "阻塞原因"
   ```

### 步骤 3: 验证进度

定期检查进度：

```bash
supercraft status
```

## 错误处理

### 如果步骤失败

1. 分析错误原因
2. 如果可以修复，继续执行
3. 如果无法修复，标记任务阻塞：
   ```bash
   supercraft task block <task-id> "错误描述"
   ```

### 如果需要回退

```bash
# 回退单个任务
supercraft task rollback <task-id>

# 查看历史快照
supercraft state history

# 恢复到历史快照
supercraft state restore <snapshot-file>
```

## 关键原则

- **按顺序执行** - 除非明确允许并行
- **验证每步** - 确保测试通过再继续
- **频繁提交** - 每个任务完成后提交
- **保持状态** - 及时更新任务状态

## 完成后

1. 运行完整测试套件
2. 检查所有任务已完成：
   ```bash
   supercraft task list -s pending
   supercraft task list -s in_progress
   supercraft task list -s blocked
   ```
3. 调用 verification skill 验证
```

**Step 3: Commit**

```bash
git add skills/execute-plan/SKILL.md
git commit -m "feat: add execute-plan skill"
```

---

## Task 10: 端到端验证

**Step 1: 编译项目**

```bash
npm run build
```

Expected: 编译成功，无错误

**Step 2: 测试完整流程**

```bash
# 创建测试目录
rm -rf /tmp/supercraft-phase2-test
mkdir -p /tmp/supercraft-phase2-test
cd /tmp/supercraft-phase2-test

# 初始化
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js init

# 创建任务
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task create --title "任务1" --description "测试任务" --priority high
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task create --title "任务2" --priority medium

# 查看任务列表
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task list

# 开始任务
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task start task-1

# 查看状态
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js status

# 完成任务
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task complete task-1

# 阻塞任务
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task block task-2 "等待依赖"

# 回退任务
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js task rollback task-2

# 创建快照
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js state snapshot

# 查看历史
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js state history

# 恢复快照
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js state restore $(ls .supercraft/history/ | head -1)
```

Expected: 所有命令正常执行，状态正确变更

**Step 3: 验证文件结构**

```bash
cd /tmp/supercraft-phase2-test
ls -la .supercraft/history/
cat .supercraft/state.yaml
```

Expected: 快照文件存在，状态文件正确

**Step 4: 最终 Commit**

```bash
cd /Users/wangguiping/workspace/github/supercraft
git add -A
git commit -m "chore: phase 2 complete - task/state commands, writing-plans and execute-plan skills"
git push
```

---

## Phase 2 验收标准

- [ ] `supercraft task list` 列出所有任务
- [ ] `supercraft task show <id>` 显示任务详情
- [ ] `supercraft task create` 创建新任务
- [ ] `supercraft task start <id>` 开始任务
- [ ] `supercraft task complete <id>` 完成任务
- [ ] `supercraft task block <id>` 阻塞任务
- [ ] `supercraft task rollback <id>` 回退任务
- [ ] `supercraft state snapshot` 创建快照
- [ ] `supercraft state history` 列出历史
- [ ] `supercraft state restore <file>` 恢复快照
- [ ] `skills/writing-plans/SKILL.md` 存在
- [ ] `skills/execute-plan/SKILL.md` 存在
- [ ] 状态在会话间保持（通过 YAML 文件）
- [ ] 能回退到历史快照

---

*Plan created: 2026-02-18*
