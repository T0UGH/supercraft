# Supercraft 设计文档 (MVP v0.1.0)

> **创建时间**: 2026-02-18
> **状态**: 设计完成
> **作者**: Claude Code & 用户协作

---

## 1. 项目概述

### 1.1 背景

Supercraft 是为解决 Superpowers 的核心痛点而设计的 AI 辅助开发工作流系统。

**Superpowers 的核心痛点**：
1. **定制化困难** - 技能硬编码，无法根据项目特点灵活调整
2. **缺乏进度管理** - 无跨会话状态持久化，无任务追踪和可视化

### 1.2 MVP 目标

- 解决定制化问题：通过配置 + 规范注入
- 解决进度管理问题：通过状态持久化 + CLI 可视化
- 提供 4 个核心技能：brainstorming, writing-plans, execute-plan, verification

### 1.3 关键决策

| 决策项 | 选择 |
|--------|------|
| 目标平台 | Claude Code |
| 分发方式 | Claude Code Plugin（独立仓库） |
| 技术栈 | TypeScript |
| 状态文件格式 | YAML |
| 技能格式 | 静态 Markdown 文件 |
| 规范/模板注入 | CLI 调用模式 |

---

## 2. Claude Code 插件机制

### 2.1 插件结构

Supercraft 作为 Claude Code 插件发布，用户通过 `/plugins install T0UGH/supercraft` 安装。

**仓库结构**：
```
supercraft/                              # GitHub 仓库
├── .claude-plugin/
│   └── plugin.json                      # 插件元数据（必需）
├── hooks/
│   ├── hooks.json                       # Hook 配置
│   └── session-start.sh                 # 会话启动脚本
├── src/                                 # CLI 源码
│   ├── cli/
│   ├── core/
│   └── index.ts
├── skills/                              # 技能定义
│   ├── brainstorming/
│   ├── writing-plans/
│   ├── execute-plan/
│   └── verification/
├── templates/                           # 默认模板
├── package.json
└── tsconfig.json
```

### 2.2 plugin.json

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
  "keywords": ["skills", "workflow", "progress", "customizable"]
}
```

### 2.3 安装流程

```
1. 用户在 Claude Code 中执行: /plugins install T0UGH/supercraft
2. Claude Code 下载插件到: ~/.claude/plugins/cache/
3. Skills 自动被发现，可通过 /supercraft:brainstorming 等方式触发
4. CLI 工具随插件一起安装，Skills 通过 npx supercraft 调用
```

### 2.4 Skills 与 CLI 的关系

- **Skills** 在 `skills/` 目录，由 Claude Code 自动发现
- **CLI** 在 `src/cli/` 目录，编译后通过 `npx supercraft` 调用
- **Skills 调用 CLI**：在 SKILL.md 中指导 AI 执行 Bash 命令调用 CLI

### 2.5 Session Hook 自动注入

通过 SessionStart Hook 在会话启动时自动注入上下文。

**hooks/hooks.json**:
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

**hooks/session-start.sh**:
```bash
#!/bin/bash
# 读取项目配置和状态，注入 AI 上下文

PROJECT_ROOT=$(pwd)
SUPERCRAFT_DIR="${PROJECT_ROOT}/.supercraft"

# 检查是否已初始化
if [ -d "$SUPERCRAFT_DIR" ]; then
  CONFIG_CONTENT=$(cat "${SUPERCRAFT_DIR}/config.yaml" 2>/dev/null || echo "")
  STATE_CONTENT=$(cat "${SUPERCRAFT_DIR}/state.yaml" 2>/dev/null || echo "")

  # 输出 JSON 格式的上下文注入
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<SUPERCRRAFT_CONTEXT>\n当前项目配置:\n${CONFIG_CONTENT}\n\n当前进度:\n${STATE_CONTENT}\n</SUPERCRRAFT_CONTEXT>"
  }
}
EOF
fi
```

**自动注入 vs 显式调用**:

| 内容 | 注入方式 | 原因 |
|------|----------|------|
| 项目配置 (`config.yaml`) | Hook 自动注入 | 每个会话都需要知道配置 |
| 当前状态 (`state.yaml`) | Hook 自动注入 | AI 需要知道当前进度 |
| 用户规范 (`specs/*`) | Skill 显式调用 | 按需获取，不是每个会话都需要 |
| 文档模板 (`templates/*`) | Skill 显式调用 | 只有特定 Skill 需要模板 |

---

## 3. CLI 命令设计

```
supercraft <command> [options]

Commands:
  init                    初始化项目（创建 .supercraft/ 目录）

  config                  配置管理
    config list           列出当前配置
    config get <key>      获取配置项
    config set <key> <value>  设置配置项

  status                  查看当前项目状态和进度

  task                    任务管理
    task list             列出所有任务
    task show <id>        显示任务详情
    task create           创建新任务（交互式）
    task start <id>       开始执行任务
    task complete <id>    标记任务完成
    task block <id> <reason>  标记任务阻塞
    task rollback <id>    回退任务到上一状态
    task rollback <id> --to <status>  回退到指定状态

  state                   状态管理
    state snapshot        创建当前状态快照
    state history         列出历史快照
    state restore <file>  恢复到指定快照

  spec                    规范管理
    spec list             列出所有规范
    spec get <name>       获取规范内容（供 AI 读取）
    spec edit <name>      编辑规范（打开编辑器）

  template                模板管理
    template list         列出可用模板
    template show <name>  显示模板内容

Options:
  --global                操作全局配置（而非项目配置）
  --json                  JSON 格式输出
  --help, -h              显示帮助
```

---

## 4. 项目初始化结构

`supercraft init` 在用户项目中创建的结构：

```
.supercraft/
├── config.yaml          # 项目配置
├── state.yaml           # 任务状态
├── history/             # 状态快照历史
│   ├── 2026-02-18T10-00-00.yaml
│   └── 2026-02-18T11-00-00.yaml
├── specs/               # 用户规范
│   └── coding-style.md
└── templates/           # 文档模板
    ├── design-doc.md
    └── plan.md
```

---

## 5. 配置系统

### 5.1 配置层级

```
全局配置 (~/.supercraft/config.yaml)  ← 最低优先级
    ↓ 覆盖
项目配置 (.supercraft/config.yaml)
```

### 5.2 配置文件结构

**MVP 极简配置**：

```yaml
# .supercraft/config.yaml

project:
  name: my-project

verification:
  commands:
    - npm test
```

**设计原则**：
- MVP 只保留**必须**的配置项
- 技能行为由 SKILL.md 定义，不通过配置调整
- 用户定制通过 `specs/` 目录注入规范实现，不通过技能配置
- 后续版本根据实际需求再增加配置项

**移除的配置项**：
- `skills.*.enabled` — 技能总是可用，由用户决定是否触发
- `skills.*.strictness` — 技能行为在 SKILL.md 中定义
- `progress.auto_save` — 状态总是自动保存

---

## 6. 状态管理

### 6.1 状态文件结构

```yaml
# .supercraft/state.yaml

version: "1.0"
project:
  name: my-project
  root: /path/to/project

current:
  plan_id: plan-2026-02-18-auth
  plan_name: 用户认证功能
  phase: implementation

tasks:
  - id: task-1
    title: 实现登录 API
    description: 创建登录接口，支持用户名密码登录
    status: completed      # pending | in_progress | completed | blocked
    priority: high
    created_at: 2026-02-18T09:00:00Z
    started_at: 2026-02-18T09:00:00Z
    completed_at: 2026-02-18T10:30:00Z
    blocked_reason: null

  - id: task-2
    title: 添加登录表单
    status: in_progress
    priority: high
    created_at: 2026-02-18T09:00:00Z
    started_at: 2026-02-18T10:35:00Z
    completed_at: null
    blocked_reason: null

metrics:
  total_tasks: 2
  completed: 1
  in_progress: 1
  pending: 0
  blocked: 0
  progress_percent: 50

metadata:
  created_at: 2026-02-18T09:00:00Z
  updated_at: 2026-02-18T10:35:00Z
```

### 6.2 任务状态流转

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 待处理 | `in_progress`, `blocked` |
| `in_progress` | 进行中 | `completed`, `blocked` |
| `completed` | 已完成 | - |
| `blocked` | 被阻塞 | `pending`, `in_progress` |

### 6.3 AI 读写状态

AI 通过 **调用 CLI 命令** 读写状态，不直接操作文件。

**读取状态**：
```bash
supercraft status          # 查看整体进度
supercraft task show <id>  # 查看单个任务
```

**更新状态**：
```bash
supercraft task start <id>           # 开始任务
supercraft task complete <id>        # 完成任务
supercraft task block <id> <reason>  # 阻塞任务
```

### 6.4 状态回退

支持回退到之前的状态快照，用于：
- 撤销错误操作
- 恢复到某个历史节点
- 调试和审计

**快照机制**：
```
.supercraft/
├── state.yaml              # 当前状态
└── history/                # 历史快照
    ├── 2026-02-18T10-00-00.yaml
    ├── 2026-02-18T11-00-00.yaml
    └── 2026-02-18T12-00-00.yaml
```

**回退命令**：
```bash
supercraft task rollback <task-id>        # 回退单个任务到上一状态
supercraft task rollback <task-id> --to <status>  # 回退到指定状态
supercraft state restore <snapshot-file>  # 恢复整个快照
supercraft state history                  # 列出所有快照
```

**自动快照时机**：
- 每次 `task` 命令执行前
- `supercraft init` 时
- 用户手动执行 `supercraft state snapshot`

---

## 7. 技能系统

### 7.1 设计原则

- 技能是静态 Markdown 文件
- 不引入模板引擎
- 配置和技能内容分开注入，AI 读取配置后自己决定行为

### 7.2 技能文件结构

```
skills/
└── brainstorming/
    └── SKILL.md           # 技能主体（静态 Markdown）
```

### 7.3 技能元数据

```yaml
---
name: brainstorming
description: "Use when starting any creative work"
---
```

### 7.4 MVP 核心技能

| 技能 | 功能 |
|------|------|
| `brainstorming` | 头脑风暴，将想法转化为设计 |
| `writing-plans` | 编写实施计划 |
| `execute-plan` | 执行实施计划 |
| `verification` | 完成前验证 |

---

## 8. 规范注入系统

### 8.1 核心思路

Skills 执行时，先调用 CLI 获取用户规范内容，然后注入到 AI 上下文中。

### 8.2 调用模式

```
Skill 被触发
    ↓
调用 CLI: supercraft spec get <name>
    ↓
CLI 返回规范内容
    ↓
注入 AI 上下文
    ↓
AI 基于规范执行 Skill
```

### 8.3 使用示例

**execute-plan skill**:
```
1. 调用: supercraft spec get coding-style
2. CLI 返回: 用户定义的代码规范
3. 注入到 AI 上下文
4. AI 按照规范执行计划
```

**brainstorming skill**:
```
1. 调用: supercraft template show design-doc
2. CLI 返回: 设计文档模板内容
3. 注入到 AI 上下文
4. AI 基于模板结构进行头脑风暴
```

---

## 9. 测试策略

| 模块 | 测试重点 |
|------|----------|
| `core/config` | 配置加载、合并、验证 |
| `core/state` | 状态 CRUD、持久化 |
| `cli/commands` | 命令解析、输出格式 |

**测试工具**: Jest + tsx

---

## 10. 分阶段交付计划

### Phase 1: 核心链路验证

**目标**：验证插件安装 + Hook 注入 + 技能触发

| 功能 | 说明 |
|------|------|
| `.claude-plugin/plugin.json` | 插件元数据 |
| `hooks/hooks.json` + `session-start.sh` | 会话启动时注入配置 |
| `supercraft init` | 创建 `.supercraft/` 目录结构 |
| `supercraft status` | 查看当前状态 |
| `brainstorming` skill | 验证技能可被触发 |

**验收标准**：
- [ ] `supercraft init` 创建正确的目录结构
- [ ] 会话启动时 AI 能看到配置内容
- [ ] `/supercraft:brainstorming` 能触发技能

### Phase 2: 状态管理

**目标**：验证状态持久化 + AI 读写

| 功能 | 说明 |
|------|------|
| `state.yaml` 持久化 | 任务状态持久化 |
| `supercraft task` 命令组 | 任务 CRUD |
| `supercraft state` 命令组 | 快照和回退 |
| `writing-plans` skill | 创建任务并写入状态 |
| `execute-plan` skill | 读取状态执行任务 |

**验收标准**：
- [ ] AI 能通过 CLI 创建/更新任务
- [ ] 状态在会话间保持
- [ ] 能回退到历史快照

### Phase 3: 完整功能

**目标**：完整 MVP 功能

| 功能 | 说明 |
|------|------|
| `supercraft config` 命令组 | 配置管理 |
| `supercraft spec` 命令组 | 规范管理 |
| `supercraft template` 命令组 | 模板管理 |
| `verification` skill | 完成前验证 |

**验收标准**：
- [ ] 所有 CLI 命令可用
- [ ] 4 个技能完整可用
- [ ] 用户规范/模板能被正确注入

---

*文档状态：MVP 设计完成*
*最后更新：2026-02-18*
