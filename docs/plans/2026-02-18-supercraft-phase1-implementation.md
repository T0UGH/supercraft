# Supercraft Phase 1 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 验证插件安装 + Hook 注入 + CLI 基础命令 + 技能触发

**Architecture:** TypeScript CLI 工具 + Claude Code 插件机制。CLI 使用 commander.js 解析命令，使用 yaml 处理配置文件。Skills 是静态 Markdown 文件，通过 hooks 在会话启动时注入上下文。

**Tech Stack:** TypeScript, Node.js, commander.js, js-yaml, yaml

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: 初始化 npm 项目**

```bash
npm init -y
```

Expected: `package.json` 创建成功

**Step 2: 配置 package.json**

修改 `package.json`:

```json
{
  "name": "supercraft",
  "version": "0.1.0",
  "description": "可定制的 AI 辅助开发工作流系统",
  "type": "module",
  "bin": {
    "supercraft": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  },
  "keywords": ["claude-code", "skills", "workflow"],
  "author": "T0UGH",
  "license": "MIT"
}
```

**Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 4: 创建 .gitignore**

```
node_modules/
dist/
*.log
.DS_Store
```

**Step 5: 安装依赖**

```bash
npm install commander js-yaml yaml
npm install -D typescript @types/node @types/js-yaml jest @types/jest tsx
```

Expected: 依赖安装成功

**Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore
git commit -m "chore: initialize project with TypeScript config"
```

---

## Task 2: CLI 基础框架

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/index.ts`

**Step 1: 创建 CLI 入口文件**

Create `src/cli/index.ts`:

```typescript
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
```

**Step 2: 创建主导出文件**

Create `src/index.ts`:

```typescript
export { initCommand } from './cli/commands/init.js';
export { statusCommand } from './cli/commands/status.js';
```

**Step 3: 编译验证**

```bash
npm run build
```

Expected: 编译失败（缺少 commands），这是预期的

**Step 4: Commit**

```bash
git add src/cli/index.ts src/index.ts
git commit -m "feat: add CLI framework with commander"
```

---

## Task 3: init 命令

**Files:**
- Create: `src/cli/commands/init.ts`
- Create: `src/core/filesystem.ts`

**Step 1: 创建文件系统工具**

Create `src/core/filesystem.ts`:

```typescript
import fs from 'fs';
import path from 'path';

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function getProjectRoot(): string {
  return process.cwd();
}

export function getSupercraftDir(): string {
  return path.join(getProjectRoot(), '.supercraft');
}
```

**Step 2: 创建 init 命令**

Create `src/cli/commands/init.ts`:

```typescript
import { Command } from 'commander';
import path from 'path';
import { ensureDir, writeFile, fileExists, getSupercraftDir, getProjectRoot } from '../../core/filesystem.js';

const DEFAULT_CONFIG = `# Supercraft 项目配置

project:
  name: my-project

verification:
  commands:
    - npm test
`;

const DEFAULT_STATE = `# Supercraft 状态文件

version: "1.0"
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
```

**Step 3: 编译验证**

```bash
npm run build
```

Expected: 编译成功

**Step 4: 测试 init 命令**

```bash
# 在临时目录测试
mkdir -p /tmp/supercraft-test && cd /tmp/supercraft-test
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js init
ls -la .supercraft/
```

Expected: `.supercraft/` 目录创建成功，包含所有文件

**Step 5: Commit**

```bash
cd /Users/wangguiping/workspace/github/supercraft
git add src/core/filesystem.ts src/cli/commands/init.ts
git commit -m "feat: add init command to create .supercraft directory"
```

---

## Task 4: status 命令

**Files:**
- Create: `src/cli/commands/status.ts`
- Create: `src/core/state.ts`

**Step 1: 创建状态类型定义**

Create `src/core/types.ts`:

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  blocked_reason?: string;
}

export interface Metrics {
  total_tasks: number;
  completed: number;
  in_progress: number;
  pending: number;
  blocked: number;
  progress_percent: number;
}

export interface State {
  version: string;
  project: {
    name: string;
    root: string;
  };
  current?: {
    plan_id?: string;
    plan_name?: string;
    phase?: string;
  };
  tasks: Task[];
  metrics: Metrics;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

export interface Config {
  project: {
    name: string;
  };
  verification?: {
    commands: string[];
  };
}
```

**Step 2: 创建状态管理模块**

Create `src/core/state.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { State, Task } from './types.js';
import { getSupercraftDir, fileExists } from './filesystem.js';

const STATE_FILE = 'state.yaml';

export function getStatePath(): string {
  return path.join(getSupercraftDir(), STATE_FILE);
}

export function loadState(): State | null {
  const statePath = getStatePath();
  if (!fileExists(statePath)) {
    return null;
  }
  const content = fs.readFileSync(statePath, 'utf-8');
  return yaml.parse(content) as State;
}

export function saveState(state: State): void {
  state.metadata.updated_at = new Date().toISOString();
  const statePath = getStatePath();
  const content = yaml.stringify(state);
  fs.writeFileSync(statePath, content, 'utf-8');
}

export function calculateMetrics(tasks: Task[]): State['metrics'] {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const in_progress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const total_tasks = tasks.length;
  const progress_percent = total_tasks > 0 ? Math.round((completed / total_tasks) * 100) : 0;

  return {
    total_tasks,
    completed,
    in_progress,
    pending,
    blocked,
    progress_percent
  };
}

export function formatProgress(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
```

**Step 3: 创建 status 命令**

Create `src/cli/commands/status.ts`:

```typescript
import { Command } from 'commander';
import { loadState, formatProgress } from '../../core/state.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

export const statusCommand = new Command('status')
  .description('查看当前项目状态和进度')
  .action(() => {
    const supercraftDir = getSupercraftDir();

    // 检查是否已初始化
    if (!fileExists(supercraftDir)) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const state = loadState();

    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    // 显示项目信息
    console.log(`\n项目: ${state.project.name}`);
    console.log(`根目录: ${state.project.root}`);

    // 显示当前计划
    if (state.current?.plan_name) {
      console.log(`\n当前计划: ${state.current.plan_name}`);
      console.log(`阶段: ${state.current.phase || '-'}`);
    }

    // 显示进度
    const { metrics } = state;
    console.log(`\n进度: ${formatProgress(metrics.progress_percent)} ${metrics.progress_percent}%`);
    console.log(`  总计: ${metrics.total_tasks} | 完成: ${metrics.completed} | 进行中: ${metrics.in_progress} | 待处理: ${metrics.pending} | 阻塞: ${metrics.blocked}`);

    // 显示任务列表
    if (state.tasks.length > 0) {
      console.log('\n任务:');
      for (const task of state.tasks) {
        const statusIcon = {
          completed: '✓',
          in_progress: '●',
          pending: '○',
          blocked: '✗'
        }[task.status];
        console.log(`  ${statusIcon} ${task.id}: ${task.title}`);
      }
    } else {
      console.log('\n暂无任务');
    }

    console.log(`\n最后更新: ${state.metadata.updated_at}\n`);
  });
```

**Step 4: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
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
```

**Step 5: 编译并测试**

```bash
npm run build
cd /tmp/supercraft-test
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js status
```

Expected: 显示项目状态

**Step 6: Commit**

```bash
cd /Users/wangguiping/workspace/github/supercraft
git add src/core/types.ts src/core/state.ts src/cli/commands/status.ts src/cli/index.ts
git commit -m "feat: add status command to show project progress"
```

---

## Task 5: 插件元数据

**Files:**
- Create: `.claude-plugin/plugin.json`

**Step 1: 创建插件目录**

```bash
mkdir -p .claude-plugin
```

**Step 2: 创建 plugin.json**

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "supercraft",
  "description": "可定制的 AI 辅助开发工作流系统，支持配置注入和进度管理",
  "version": "0.1.0",
  "author": {
    "name": "T0UGH"
  },
  "homepage": "https://github.com/T0UGH/supercraft",
  "repository": "https://github.com/T0UGH/supercraft",
  "license": "MIT",
  "keywords": ["skills", "workflow", "progress", "customizable", "claude-code"]
}
```

**Step 3: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "feat: add Claude Code plugin metadata"
```

---

## Task 6: Session Hook

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/session-start.sh`

**Step 1: 创建 hooks 目录**

```bash
mkdir -p hooks
```

**Step 2: 创建 hooks.json**

Create `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh"
          }
        ]
      }
    ]
  }
}
```

**Step 3: 创建 session-start.sh**

Create `hooks/session-start.sh`:

```bash
#!/bin/bash
# SessionStart hook for supercraft plugin
# 读取项目配置和状态，注入 AI 上下文

set -euo pipefail

# 确定插件根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 获取当前项目目录
PROJECT_ROOT="${PWD}"
SUPERCRAFT_DIR="${PROJECT_ROOT}/.supercraft"

# 转义 JSON 字符串
escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# 检查是否已初始化
if [ -d "$SUPERCRAFT_DIR" ]; then
  # 读取配置文件
  CONFIG_CONTENT=""
  if [ -f "${SUPERCRAFT_DIR}/config.yaml" ]; then
    CONFIG_CONTENT=$(cat "${SUPERCRAFT_DIR}/config.yaml" 2>/dev/null || echo "")
  fi

  # 读取状态文件
  STATE_CONTENT=""
  if [ -f "${SUPERCRAFT_DIR}/state.yaml" ]; then
    STATE_CONTENT=$(cat "${SUPERCRAFT_DIR}/state.yaml" 2>/dev/null || echo "")
  fi

  # 转义内容
  CONFIG_ESCAPED=$(escape_for_json "$CONFIG_CONTENT")
  STATE_ESCAPED=$(escape_for_json "$STATE_CONTENT")

  # 输出 JSON 格式的上下文注入
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<SUPERCRRAFT_CONTEXT>\n当前项目配置:\n${CONFIG_ESCAPED}\n\n当前进度:\n${STATE_ESCAPED}\n</SUPERCRRAFT_CONTEXT>"
  }
}
EOF
fi

exit 0
```

**Step 4: 设置执行权限**

```bash
chmod +x hooks/session-start.sh
```

**Step 5: Commit**

```bash
git add hooks/hooks.json hooks/session-start.sh
git commit -m "feat: add session start hook for context injection"
```

---

## Task 7: brainstorming skill

**Files:**
- Create: `skills/brainstorming/SKILL.md`

**Step 1: 创建 skills 目录**

```bash
mkdir -p skills/brainstorming
```

**Step 2: 创建 SKILL.md**

Create `skills/brainstorming/SKILL.md`:

```markdown
---
name: brainstorming
description: "Use when starting any creative work - creating features, building components, adding functionality"
---

# Brainstorming: 将想法转化为设计

## 概述

帮助用户通过自然对话将想法转化为完整的设计和规格。

## 前置步骤

1. **获取用户规范**（如果需要）：
   ```bash
   supercraft spec get coding-style
   ```
   将返回的规范内容用于后续工作。

2. **创建设计文档**：
   ```bash
   supercraft template copy design-doc
   ```
   这会在 `docs/plans/` 目录创建一个设计文档副本。

## 工作流程

### 步骤 1: 探索项目上下文

- 检查项目文件结构
- 查看最近提交
- 了解现有架构

### 步骤 2: 提出澄清问题

- 一次只问一个问题
- 理解目的、约束、成功标准
- 使用多选题形式（如果适用）

### 步骤 3: 提出方案

- 提出 2-3 种不同的方案
- 说明各方案的权衡
- 给出推荐方案和理由

### 步骤 4: 呈现设计

- 按部分呈现设计
- 每个部分后确认是否正确
- 覆盖：架构、组件、数据流、错误处理、测试

### 步骤 5: 保存设计文档

- 将设计保存到 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 提交到 git

## 设计文档结构

```markdown
# [主题] 设计文档

> **创建时间**: YYYY-MM-DD
> **状态**: 草稿/评审中/已批准

## 1. 概述
- 背景
- 目标
- 范围

## 2. 技术方案
- 架构设计
- 组件设计
- 数据流

## 3. API 设计
- 接口定义
- 数据结构

## 4. 测试策略
- 单元测试
- 集成测试

## 5. 实施计划
- 任务分解
- 里程碑
```

## 关键原则

- **一个问题一次** - 不要用多个问题淹没用户
- **YAGNI** - 只设计需要的功能
- **渐进式验证** - 每个部分后确认
- **保持灵活** - 随时可以回退澄清
```

**Step 3: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add brainstorming skill"
```

---

## Task 8: 默认模板

**Files:**
- Create: `templates/design-doc.md`
- Create: `templates/plan.md`

**Step 1: 创建 templates 目录**

```bash
mkdir -p templates
```

**Step 2: 创建设计文档模板**

Create `templates/design-doc.md`:

```markdown
# {title} 设计文档

> **创建时间**: {date}
> **状态**: 草稿

## 1. 概述

### 1.1 背景
[请描述背景]

### 1.2 目标
[请描述目标]

### 1.3 范围
[请描述范围]

## 2. 技术方案

### 2.1 架构设计
[请描述架构]

### 2.2 组件设计
[请描述组件]

### 2.3 数据流
[请描述数据流]

## 3. API 设计

### 3.1 接口定义
[请描述接口]

### 3.2 数据结构
[请描述数据结构]

## 4. 测试策略

### 4.1 单元测试
[请描述单元测试策略]

### 4.2 集成测试
[请描述集成测试策略]

## 5. 实施计划

### 5.1 任务分解
[请列出任务]

### 5.2 里程碑
[请列出里程碑]
```

**Step 3: 创建计划模板**

Create `templates/plan.md`:

```markdown
# {title} 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [一句话描述目标]

**Architecture:** [2-3 句描述架构]

**Tech Stack:** [关键技术/库]

---

## Task 1: [任务名称]

**Files:**
- Create: `path/to/file.ts`
- Modify: `path/to/existing.ts:10-20`

**Step 1: [具体步骤]**

[代码或命令]

**Step 2: 验证**

[验证命令和预期结果]

**Step 3: Commit**

```bash
git add [files]
git commit -m "[message]"
```

---

[重复 Task 结构...]
```

**Step 4: Commit**

```bash
git add templates/design-doc.md templates/plan.md
git commit -m "feat: add default templates for design docs and plans"
```

---

## Task 9: README 文档

**Files:**
- Create: `README.md`

**Step 1: 创建 README**

Create `README.md`:

```markdown
# Supercraft

可定制的 AI 辅助开发工作流系统，为 Claude Code 提供配置注入和进度管理能力。

## 安装

```bash
# 通过 Claude Code 安装
/plugins install T0UGH/supercraft
```

## 快速开始

```bash
# 初始化项目
supercraft init

# 查看状态
supercraft status
```

## 功能

- **配置管理**: 全局 + 项目级配置
- **状态持久化**: 任务状态跨会话保持
- **技能系统**: 4 个核心技能
  - `brainstorming`: 头脑风暴
  - `writing-plans`: 编写计划
  - `execute-plan`: 执行计划
  - `verification`: 完成前验证
- **规范注入**: 用户自定义规范注入 AI 上下文
- **模板管理**: 设计文档、计划模板

## 目录结构

```
.supercraft/
├── config.yaml      # 项目配置
├── state.yaml       # 任务状态
├── history/         # 状态快照
├── specs/           # 用户规范
└── templates/       # 文档模板
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run build

# 测试
npm test
```

## 许可证

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
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
rm -rf /tmp/supercraft-e2e
mkdir -p /tmp/supercraft-e2e
cd /tmp/supercraft-e2e

# 测试 init
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js init
ls -la .supercraft/

# 测试 status
node /Users/wangguiping/workspace/github/supercraft/dist/cli/index.js status
```

Expected:
- `init` 创建 `.supercraft/` 目录及所有文件
- `status` 显示项目状态

**Step 3: 验证文件结构**

```bash
# 检查创建的文件
cd /tmp/supercraft-e2e/.supercraft
ls -la
cat config.yaml
cat state.yaml
ls specs/
ls templates/
```

Expected:
- `config.yaml` 存在且格式正确
- `state.yaml` 存在且格式正确
- `specs/coding-style.md` 存在
- `templates/design-doc.md` 和 `templates/plan.md` 存在

**Step 4: 最终 Commit**

```bash
cd /Users/wangguiping/workspace/github/supercraft
git add -A
git commit -m "chore: phase 1 complete - plugin, hooks, init, status commands"
git push
```

---

## Phase 1 验收标准

- [ ] `supercraft init` 创建正确的目录结构
- [ ] `supercraft status` 显示项目状态
- [ ] `.claude-plugin/plugin.json` 存在
- [ ] `hooks/session-start.sh` 可执行
- [ ] `skills/brainstorming/SKILL.md` 存在
- [ ] `templates/` 包含默认模板
- [ ] 项目可通过 `npm run build` 编译

---

*Plan created: 2026-02-18*
