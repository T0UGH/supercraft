# Supercraft Phase 3 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成 MVP 全部功能 - config/spec/template 命令组和 verification 技能

**Architecture:** 扩展 CLI 添加 config、spec、template 命令组，实现配置管理、规范注入和模板复制功能。添加 verification 技能用于完成前验证。

**Tech Stack:** TypeScript, Node.js, commander.js, yaml

---

## Task 1: config 命令组

**Files:**
- Create: `src/cli/commands/config.ts`
- Create: `src/core/config.ts`

**Step 1: 创建配置类型定义**

在 `src/core/types.ts` 中确认 Config 接口已存在:

```typescript
export interface Config {
  project: {
    name: string;
  };
  verification?: {
    commands: string[];
  };
}
```

**Step 2: 创建配置管理模块**

Create `src/core/config.ts`:

```typescript
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
  const content = fs.readFileSync(configPath, 'utf-8');
  return yaml.parse(content) as Config;
}

export function loadProjectConfig(): Config | null {
  const configPath = getProjectConfigPath();
  if (!fileExists(configPath)) {
    return null;
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return yaml.parse(content) as Config;
}

export function mergeConfigs(global: Config | null, project: Config | null): Config {
  return {
    project: project?.project || global?.project || { name: 'unknown' },
    verification: project?.verification || global?.verification
  };
}

export function loadConfig(): Config {
  const global = loadGlobalConfig();
  const project = loadProjectConfig();
  return mergeConfigs(global, project);
}

export function saveProjectConfig(config: Config): void {
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
```

**Step 3: 创建 config 命令**

Create `src/cli/commands/config.ts`:

```typescript
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
```

**Step 4: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { taskCommand } from './commands/task.js';
import { stateCommand } from './commands/state.js';
import { configCommand } from './commands/config.js';

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
program.addCommand(configCommand);

program.parse();
```

**Step 5: 编译并测试**

```bash
npm run build
node dist/cli/index.js config list
node dist/cli/index.js config set project.name "test-project"
node dist/cli/index.js config get project.name
```

Expected: 配置命令正常工作

**Step 6: Commit**

```bash
git add src/core/config.ts src/cli/commands/config.ts src/cli/index.ts
git commit -m "feat: add config command group (list, get, set)"
```

---

## Task 2: spec list 命令

**Files:**
- Create: `src/cli/commands/spec.ts`

**Step 1: 创建 spec 命令框架**

Create `src/cli/commands/spec.ts`:

```typescript
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

const specCommand = new Command('spec')
  .description('规范管理（知识类）');

// spec list 子命令
const listCommand = new Command('list')
  .description('列出所有规范')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const specsDir = path.join(getSupercraftDir(), 'specs');
    if (!fs.existsSync(specsDir)) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无规范');
      }
      return;
    }

    const files = fs.readdirSync(specsDir)
      .filter(f => f.endsWith('.md'));

    if (files.length === 0) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无规范');
      }
      return;
    }

    if (options.json) {
      const specs = files.map(f => ({
        name: f.replace('.md', ''),
        file: f,
        path: path.join(specsDir, f)
      }));
      console.log(JSON.stringify(specs, null, 2));
      return;
    }

    console.log('\n规范列表:\n');
    for (const file of files) {
      const name = file.replace('.md', '');
      const filePath = path.join(specsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${name}`);
      console.log(`    文件: ${file}`);
      console.log(`    更新: ${stats.mtime.toISOString().split('T')[0]}`);
    }
    console.log('');
  });

specCommand.addCommand(listCommand);

export { specCommand };
```

**Step 2: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
import { specCommand } from './commands/spec.js';

// 在 program.parse() 前添加
program.addCommand(specCommand);
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js spec list
```

Expected: 列出规范文件

**Step 4: Commit**

```bash
git add src/cli/commands/spec.ts src/cli/index.ts
git commit -m "feat: add spec list command"
```

---

## Task 3: spec get 命令

**Files:**
- Modify: `src/cli/commands/spec.ts`

**Step 1: 添加 spec get 子命令**

在 `src/cli/commands/spec.ts` 中添加:

```typescript
// spec get 子命令
const getCommand = new Command('get')
  .description('获取规范内容（注入 AI 上下文）')
  .argument('<name>', '规范名称')
  .action((name) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const specsDir = path.join(getSupercraftDir(), 'specs');
    const specFile = path.join(specsDir, `${name}.md`);

    if (!fs.existsSync(specFile)) {
      console.log(`✗ 规范不存在: ${name}`);
      console.log(`  运行 supercraft spec list 查看可用规范`);
      return;
    }

    const content = fs.readFileSync(specFile, 'utf-8');

    // 输出规范内容（用于注入 AI 上下文）
    console.log(`\n<SPEC name="${name}">\n`);
    console.log(content);
    console.log(`\n</SPEC>\n`);
  });

specCommand.addCommand(getCommand);
```

**Step 2: 编译并测试**

```bash
npm run build
node dist/cli/index.js spec get coding-style
```

Expected: 输出规范内容，带 SPEC 标签

**Step 3: Commit**

```bash
git add src/cli/commands/spec.ts
git commit -m "feat: add spec get command for AI context injection"
```

---

## Task 4: template list 和 show 命令

**Files:**
- Create: `src/cli/commands/template.ts`

**Step 1: 创建 template 命令框架**

Create `src/cli/commands/template.ts`:

```typescript
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

// 获取插件内置模板目录
function getBuiltinTemplatesDir(): string {
  // 使用 CLAUDE_PLUGIN_ROOT 环境变量（Claude Code 插件标准环境变量）
  // fallback 到当前目录（用于本地测试）
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
  return path.join(pluginRoot, 'templates');
}

// 获取项目自定义模板目录
function getProjectTemplatesDir(): string {
  return path.join(getSupercraftDir(), 'templates');
}

// 列出所有模板（内置 + 项目）
function listAllTemplates(): { name: string; source: string; file: string }[] {
  const templates: { name: string; source: string; file: string }[] = [];

  // 项目模板
  const projectDir = getProjectTemplatesDir();
  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      templates.push({
        name: file.replace('.md', ''),
        source: 'project',
        file
      });
    }
  }

  // 内置模板
  const builtinDir = getBuiltinTemplatesDir();
  if (fs.existsSync(builtinDir)) {
    const files = fs.readdirSync(builtinDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const name = file.replace('.md', '');
      // 项目模板优先级更高
      if (!templates.find(t => t.name === name)) {
        templates.push({
          name,
          source: 'builtin',
          file
        });
      }
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

const templateCommand = new Command('template')
  .description('模板管理（模板类）');

// template list 子命令
const listCommand = new Command('list')
  .description('列出可用模板')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    const templates = listAllTemplates();

    if (templates.length === 0) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无模板');
      }
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(templates, null, 2));
      return;
    }

    console.log('\n模板列表:\n');
    for (const t of templates) {
      const sourceLabel = t.source === 'project' ? '(项目)' : '(内置)';
      console.log(`  ${t.name} ${sourceLabel}`);
    }
    console.log('');
  });

// template show 子命令
const showCommand = new Command('show')
  .description('预览模板内容')
  .argument('<name>', '模板名称')
  .action((name) => {
    const templates = listAllTemplates();
    const template = templates.find(t => t.name === name);

    if (!template) {
      console.log(`✗ 模板不存在: ${name}`);
      console.log(`  运行 supercraft template list 查看可用模板`);
      return;
    }

    const dir = template.source === 'project'
      ? getProjectTemplatesDir()
      : getBuiltinTemplatesDir();
    const filePath = path.join(dir, template.file);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n# 模板: ${name} (${template.source})\n`);
    console.log(content);
  });

templateCommand.addCommand(listCommand);
templateCommand.addCommand(showCommand);

export { templateCommand };
```

**Step 2: 更新 CLI 入口**

修改 `src/cli/index.ts`:

```typescript
import { templateCommand } from './commands/template.js';

// 在 program.parse() 前添加
program.addCommand(templateCommand);
```

**Step 3: 编译并测试**

```bash
npm run build
node dist/cli/index.js template list
node dist/cli/index.js template show design-doc
```

Expected: 列出和显示模板

**Step 4: Commit**

```bash
git add src/cli/commands/template.ts src/cli/index.ts
git commit -m "feat: add template list and show commands"
```

---

## Task 5: template copy 命令

**Files:**
- Modify: `src/cli/commands/template.ts`

**Step 1: 添加 template copy 子命令**

在 `src/cli/commands/template.ts` 中添加:

```typescript
// template copy 子命令
const copyCommand = new Command('copy')
  .description('复制模板到本地（AI 调用）')
  .argument('<name>', '模板名称')
  .option('-o, --output <dir>', '输出目录', 'docs/plans')
  .option('-n, --filename <filename>', '自定义文件名')
  .action((name, options) => {
    const templates = listAllTemplates();
    const template = templates.find(t => t.name === name);

    if (!template) {
      console.log(`✗ 模板不存在: ${name}`);
      console.log(`  运行 supercraft template list 查看可用模板`);
      return;
    }

    // 获取模板内容
    const dir = template.source === 'project'
      ? getProjectTemplatesDir()
      : getBuiltinTemplatesDir();
    const templatePath = path.join(dir, template.file);
    let content = fs.readFileSync(templatePath, 'utf-8');

    // 替换占位符
    const today = new Date().toISOString().split('T')[0];
    content = content.replace(/{date}/g, today);
    content = content.replace(/{title}/g, '待填充');

    // 确定输出文件名
    const outputDir = options.output;
    let filename = options.filename;
    if (!filename) {
      filename = `${today}-${name}.md`;
    }

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      console.log(`✗ 文件已存在: ${outputPath}`);
      console.log(`  使用 --filename 指定不同的文件名`);
      return;
    }

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf-8');

    console.log(`✓ 模板已复制: ${outputPath}`);
    console.log('');
    console.log('请填充以下占位符:');
    console.log('  - {title}: 标题');
    console.log('  - [请描述...]: 描述性内容');
  });

templateCommand.addCommand(copyCommand);
```

**Step 2: 编译并测试**

```bash
npm run build
node dist/cli/index.js template copy design-doc
node dist/cli/index.js template copy plan -o docs/plans -n test-plan.md
```

Expected: 模板复制成功

**Step 3: Commit**

```bash
git add src/cli/commands/template.ts
git commit -m "feat: add template copy command for AI to use"
```

---

## Task 6: verification skill

**Files:**
- Create: `skills/verification/SKILL.md`

**Step 1: 创建 skills 目录**

```bash
mkdir -p skills/verification
```

**Step 2: 创建 SKILL.md**

Create `skills/verification/SKILL.md`:

```markdown
---
name: verification
description: "Use when about to claim work is complete, before committing or creating PRs"
---

# Verification: 完成前验证

## 概述

在声称工作完成之前，必须运行验证命令确认一切正常。**证据先于断言。**

## 前置步骤

1. **获取验证命令**：
   ```bash
   supercraft config get verification.commands
   ```

2. **检查任务状态**：
   ```bash
   supercraft status
   supercraft task list -s pending
   supercraft task list -s in_progress
   supercraft task list -s blocked
   ```

## 验证清单

### 1. 代码质量

- [ ] 代码编译通过
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告

### 2. 测试

- [ ] 所有单元测试通过
- [ ] 新代码有测试覆盖
- [ ] 边界情况已测试

### 3. 功能

- [ ] 实现符合需求
- [ ] 边界情况处理正确
- [ ] 错误处理完善

### 4. 文档

- [ ] 必要的注释已添加
- [ ] README 已更新（如需要）
- [ ] API 文档已更新（如需要）

## 验证流程

### 步骤 1: 运行验证命令

```bash
# 获取配置的验证命令
supercraft config get verification.commands

# 执行每个验证命令
npm test
npm run build
npm run lint  # 如果配置了
```

### 步骤 2: 检查任务完成情况

```bash
# 确保没有未完成的任务
supercraft task list -s pending
supercraft task list -s in_progress
supercraft task list -s blocked
```

Expected: 所有列表为空

### 步骤 3: 验证代码变更

```bash
# 查看变更
git status
git diff

# 确保只变更了预期的文件
```

### 步骤 4: 最终确认

如果所有验证通过：

1. 提交变更
2. 更新任务状态
3. 创建快照（可选）：
   ```bash
   supercraft state snapshot
   ```

## 常见问题处理

### 测试失败

1. 分析失败原因
2. 修复问题
3. 重新运行测试
4. 如果无法立即修复，标记任务阻塞

### 编译错误

1. 检查 TypeScript 配置
2. 修复类型错误
3. 重新编译

### 有未完成任务

1. 评估是否影响当前工作
2. 如果不影响，可以继续
3. 如果影响，先处理未完成任务

## 关键原则

- **证据先于断言** - 不要说"应该可以"，运行命令确认
- **完整验证** - 不要跳过任何步骤
- **记录问题** - 验证失败时记录原因
- **保持诚实** - 如果验证失败，承认并修复

## 完成后

所有验证通过后：

1. 提交代码
2. 标记所有任务完成
3. 通知用户工作完成
```

**Step 3: Commit**

```bash
git add skills/verification/SKILL.md
git commit -m "feat: add verification skill"
```

---

## Task 7: 更新 README

**Files:**
- Modify: `README.md`

**Step 1: 更新 README 添加完整功能列表**

修改 `README.md`:

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

## CLI 命令

### 基础命令

```bash
supercraft init              # 初始化项目
supercraft status            # 查看当前状态
```

### 任务管理

```bash
supercraft task list         # 列出所有任务
supercraft task list -s in_progress  # 按状态筛选
supercraft task show <id>    # 显示任务详情
supercraft task create -t "标题" -p high  # 创建任务
supercraft task start <id>   # 开始任务
supercraft task complete <id>  # 完成任务
supercraft task block <id> "原因"  # 阻塞任务
supercraft task rollback <id>  # 回退任务
```

### 状态管理

```bash
supercraft state snapshot    # 创建快照
supercraft state history     # 查看历史快照
supercraft state restore <file>  # 恢复快照
```

### 配置管理

```bash
supercraft config list       # 列出配置
supercraft config get project.name  # 获取配置项
supercraft config set project.name "my-app"  # 设置配置
supercraft config set verification.commands "npm test" --global  # 全局配置
```

### 规范管理（知识类）

```bash
supercraft spec list         # 列出规范
supercraft spec get coding-style  # 获取规范内容（注入 AI 上下文）
```

### 模板管理（模板类）

```bash
supercraft template list     # 列出模板
supercraft template show design-doc  # 预览模板
supercraft template copy design-doc  # 复制模板到本地
supercraft template copy plan -o docs/plans -n my-plan.md  # 指定输出
```

## 技能

- **brainstorming**: 头脑风暴，将想法转化为设计
- **writing-plans**: 编写实施计划
- **execute-plan**: 执行实施计划
- **verification**: 完成前验证

## 目录结构

```
.supercraft/
├── config.yaml      # 项目配置
├── state.yaml       # 任务状态
├── history/         # 状态快照
│   └── 2026-02-18T10-00-00.yaml
├── specs/           # 用户规范
│   └── coding-style.md
└── templates/       # 文档模板
    ├── design-doc.md
    └── plan.md
```

## 配置层级

```
全局配置 (~/.supercraft/config.yaml)  ← 最低优先级
    ↓ 覆盖
项目配置 (.supercraft/config.yaml)
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
git commit -m "docs: update README with all CLI commands"
```

---

## Task 8: 添加单元测试

**Files:**
- Create: `tests/core/state.test.ts`
- Create: `tests/core/config.test.ts`
- Create: `tests/cli/commands.test.ts`

**Step 1: 创建测试目录**

```bash
mkdir -p tests/core tests/cli
```

**Step 2: 创建状态测试**

Create `tests/core/state.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadState, saveState, calculateMetrics, generateTaskId } from '../../src/core/state.js';
import { State, Task } from '../../src/core/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'supercraft-test-' + Date.now());

beforeEach(() => {
  // 创建测试目录
  fs.mkdirSync(path.join(TEST_DIR, '.supercraft'), { recursive: true });
  process.chdir(TEST_DIR);
});

afterEach(() => {
  // 清理测试目录
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('calculateMetrics', () => {
  it('should calculate metrics for empty task list', () => {
    const metrics = calculateMetrics([]);
    expect(metrics.total_tasks).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.progress_percent).toBe(0);
  });

  it('should calculate metrics correctly', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'in_progress', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-3', title: 'Task 3', status: 'pending', priority: 'low', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-4', title: 'Task 4', status: 'blocked', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
    ];
    const metrics = calculateMetrics(tasks);
    expect(metrics.total_tasks).toBe(4);
    expect(metrics.completed).toBe(1);
    expect(metrics.in_progress).toBe(1);
    expect(metrics.pending).toBe(1);
    expect(metrics.blocked).toBe(1);
    expect(metrics.progress_percent).toBe(25);
  });
});

describe('generateTaskId', () => {
  it('should generate task-1 for empty list', () => {
    const id = generateTaskId([]);
    expect(id).toBe('task-1');
  });

  it('should increment id based on existing tasks', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'pending', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
    ];
    const id = generateTaskId(tasks);
    expect(id).toBe('task-3');
  });
});
```

**Step 3: 创建配置测试**

Create `tests/core/config.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { mergeConfigs } from '../../src/core/config.js';
import { Config } from '../../src/core/types.js';

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

  it('should use global value when project value is missing', () => {
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
});
```

**Step 4: 创建 CLI 命令测试**

Create `tests/cli/commands.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEST_DIR = path.join(os.tmpdir(), 'supercraft-cli-test-' + Date.now());

// Helper to run CLI commands
function runCLI(args: string[]): { stdout: string; stderr: string; status: number } {
  const cliPath = path.join(process.cwd(), 'dist/cli/index.js');
  try {
    const stdout = execSync(`node ${cliPath} ${args.join(' ')}`, {
      encoding: 'utf-8',
      cwd: TEST_DIR
    });
    return { stdout, stderr: '', status: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || '',
      status: error.status || 1
    };
  }
}

beforeEach(() => {
  // Create test directory
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);
});

afterEach(() => {
  // Cleanup
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('init command', () => {
  it('should create .supercraft directory', () => {
    runCLI(['init']);
    const supercraftDir = path.join(TEST_DIR, '.supercraft');
    expect(fs.existsSync(supercraftDir)).toBe(true);
  });

  it('should create config.yaml', () => {
    runCLI(['init']);
    const configPath = path.join(TEST_DIR, '.supercraft', 'config.yaml');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should create state.yaml', () => {
    runCLI(['init']);
    const statePath = path.join(TEST_DIR, '.supercraft', 'state.yaml');
    expect(fs.existsSync(statePath)).toBe(true);
  });

  it('should create history directory with initial snapshot', () => {
    runCLI(['init']);
    const historyDir = path.join(TEST_DIR, '.supercraft', 'history');
    expect(fs.existsSync(historyDir)).toBe(true);
    const files = fs.readdirSync(historyDir);
    expect(files.length).toBeGreaterThan(0);
  });
});

describe('status command', () => {
  it('should show error when not initialized', () => {
    const result = runCLI(['status']);
    expect(result.stdout).toContain('项目未初始化');
  });

  it('should show project status after init', () => {
    runCLI(['init']);
    const result = runCLI(['status']);
    expect(result.stdout).toContain('项目:');
    expect(result.stdout).toContain('进度:');
  });
});

describe('task command', () => {
  it('should show error when not initialized', () => {
    const result = runCLI(['task', 'list']);
    expect(result.stdout).toContain('项目未初始化');
  });

  it('should create task', () => {
    runCLI(['init']);
    const result = runCLI(['task', 'create', '--title', 'Test Task', '--priority', 'high']);
    expect(result.stdout).toContain('✓');
  });

  it('should list tasks', () => {
    runCLI(['init']);
    runCLI(['task', 'create', '--title', 'Task 1']);
    runCLI(['task', 'create', '--title', 'Task 2']);
    const result = runCLI(['task', 'list']);
    expect(result.stdout).toContain('Task 1');
    expect(result.stdout).toContain('Task 2');
  });

  it('should start task', () => {
    runCLI(['init']);
    runCLI(['task', 'create', '--title', 'Task 1']);
    const result = runCLI(['task', 'start', 'task-1']);
    expect(result.stdout).toContain('✓');
  });

  it('should complete task', () => {
    runCLI(['init']);
    runCLI(['task', 'create', '--title', 'Task 1']);
    runCLI(['task', 'start', 'task-1']);
    const result = runCLI(['task', 'complete', 'task-1']);
    expect(result.stdout).toContain('✓');
  });

  it('should block task', () => {
    runCLI(['init']);
    runCLI(['task', 'create', '--title', 'Task 1']);
    const result = runCLI(['task', 'block', 'task-1', '等待依赖']);
    expect(result.stdout).toContain('✗');
  });

  it('should filter tasks by status', () => {
    runCLI(['init']);
    runCLI(['task', 'create', '--title', 'Task 1']);
    runCLI(['task', 'create', '--title', 'Task 2']);
    runCLI(['task', 'start', 'task-1']);
    const result = runCLI(['task', 'list', '--status', 'pending']);
    expect(result.stdout).toContain('Task 2');
  });
});

describe('state command', () => {
  it('should create snapshot', () => {
    runCLI(['init']);
    const result = runCLI(['state', 'snapshot']);
    expect(result.stdout).toContain('✓');
  });

  it('should list history', () => {
    runCLI(['init']);
    runCLI(['state', 'snapshot']);
    const result = runCLI(['state', 'history']);
    expect(result.stdout).toContain('历史快照');
  });
});

describe('config command', () => {
  it('should show error when not initialized', () => {
    const result = runCLI(['config', 'list']);
    expect(result.stdout).toContain('项目未初始化');
  });

  it('should list config', () => {
    runCLI(['init']);
    const result = runCLI(['config', 'list']);
    expect(result.stdout).toContain('project.name');
  });

  it('should set and get config', () => {
    runCLI(['init']);
    runCLI(['config', 'set', 'project.name', 'test-project']);
    const result = runCLI(['config', 'get', 'project.name']);
    expect(result.stdout).toContain('test-project');
  });
});

describe('spec command', () => {
  it('should list specs', () => {
    runCLI(['init']);
    const result = runCLI(['spec', 'list']);
    expect(result.stdout).toContain('coding-style');
  });

  it('should get spec content', () => {
    runCLI(['init']);
    const result = runCLI(['spec', 'get', 'coding-style']);
    expect(result.stdout).toContain('<SPEC');
  });
});

describe('template command', () => {
  it('should list templates', () => {
    runCLI(['init']);
    const result = runCLI(['template', 'list']);
    expect(result.stdout).toContain('design-doc');
  });

  it('should copy template', () => {
    runCLI(['init']);
    const result = runCLI(['template', 'copy', 'design-doc']);
    expect(result.stdout).toContain('✓');
    expect(fs.existsSync(path.join(TEST_DIR, 'docs', 'plans'))).toBe(true);
  });
});
```

**Step 4: 更新 package.json 测试配置**

确保 `package.json` 有正确的 Jest 配置:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  },
  "jest": {
    "preset": "ts-jest/presets/default-esm",
    "testEnvironment": "node",
    "extensionsToTreatAsEsm": [".ts"],
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "transform": {
      "^.+\\.tsx?$": ["ts-jest", {
        "useESM": true
      }]
    },
    "testMatch": ["**/tests/**/*.test.ts"]
  }
}
```

**Step 5: 运行测试**

```bash
npm test
```

Expected: 测试通过

**Step 6: Commit**

```bash
git add tests/ package.json
git commit -m "test: add unit tests for state, config, and CLI commands"
```

---

## Task 9: 版本号更新

**Files:**
- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`

**Step 1: 更新版本号**

更新 `package.json`:

```json
{
  "name": "supercraft",
  "version": "0.1.0",
  ...
}
```

更新 `.claude-plugin/plugin.json`:

```json
{
  "name": "supercraft",
  "version": "0.1.0",
  ...
}
```

**Step 2: Commit**

```bash
git add package.json .claude-plugin/plugin.json
git commit -m "chore: bump version to 0.1.0 for MVP release"
```

---

## Task 10: 端到端验证

**Step 1: 编译项目**

```bash
npm run build
npm test
```

Expected: 编译和测试都通过

**Step 2: 完整功能测试**

```bash
# 创建测试目录
rm -rf /tmp/supercraft-phase3-test
mkdir -p /tmp/supercraft-phase3-test
cd /tmp/supercraft-phase3-test

CLI=/Users/wangguiping/workspace/github/supercraft/dist/cli/index.js

# 初始化
$CLI init

# 配置
$CLI config list
$CLI config set project.name "phase3-test"

# 规范
$CLI spec list
$CLI spec get coding-style

# 模板
$CLI template list
$CLI template copy design-doc
cat docs/plans/$(date +%Y-%m-%d)-design-doc.md

# 任务
$CLI task create -t "任务1" -d "测试任务" -p high
$CLI task create -t "任务2" -p medium
$CLI task list
$CLI task start task-1
$CLI task complete task-1
$CLI task block task-2 "等待"
$CLI task rollback task-2
$CLI task list

# 状态
$CLI status
$CLI state snapshot
$CLI state history

# 清理
cd /Users/wangguiping/workspace/github/supercraft
```

Expected: 所有命令正常执行

**Step 3: 最终 Commit 和推送**

```bash
cd /Users/wangguiping/workspace/github/supercraft
git add -A
git commit -m "chore: phase 3 complete - MVP v0.1.0 ready"
git push
```

---

## Phase 3 验收标准

- [ ] `supercraft config list` 列出配置
- [ ] `supercraft config get <key>` 获取配置项
- [ ] `supercraft config set <key> <value>` 设置配置项
- [ ] `supercraft spec list` 列出规范
- [ ] `supercraft spec get <name>` 获取规范内容
- [ ] `supercraft template list` 列出模板
- [ ] `supercraft template show <name>` 预览模板
- [ ] `supercraft template copy <name>` 复制模板到本地
- [ ] `skills/verification/SKILL.md` 存在
- [ ] 所有 CLI 命令可用
- [ ] 4 个技能完整可用
- [ ] 用户规范/模板能被正确注入/复制
- [ ] 单元测试通过 (core: state, config)
- [ ] CLI 命令测试通过 (commands: init, status, task, state, config, spec, template)

---

## MVP 完成清单

### Phase 1 - 核心链路
- [ ] 插件安装
- [ ] Hook 注入
- [ ] init/status 命令
- [ ] brainstorming skill

### Phase 2 - 状态管理
- [ ] task 命令组
- [ ] state 命令组
- [ ] writing-plans skill
- [ ] execute-plan skill

### Phase 3 - 完整功能
- [ ] config 命令组
- [ ] spec 命令组
- [ ] template 命令组
- [ ] verification skill

---

*Plan created: 2026-02-18*
