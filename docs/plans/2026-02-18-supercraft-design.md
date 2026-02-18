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
| 技术栈 | TypeScript |
| 状态文件格式 | YAML |
| 技能格式 | 静态 Markdown 文件 |
| 规范/模板注入 | CLI 调用模式 |

---

## 2. 项目结构

```
supercraft/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # 入口
│   ├── core/
│   │   ├── config.ts             # 配置管理
│   │   └── state.ts              # 状态管理
│   ├── cli/
│   │   ├── index.ts              # CLI 入口
│   │   └── commands/             # CLI 命令
│   └── skills/                   # 技能定义
│       ├── brainstorming/
│       ├── writing-plans/
│       ├── execute-plan/
│       └── verification/
├── templates/                    # 默认模板
│   ├── design-doc.md
│   └── plan.md
└── tests/
```

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

## 4. 目录结构

`supercraft init` 创建的结构：

```
.supercraft/
├── config.yaml          # 项目配置
├── state.yaml           # 任务状态
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
    ↓ 覆盖
环境变量 (SUPERCRAFT_*)
```

### 5.2 配置文件结构

```yaml
# .supercraft/config.yaml

project:
  name: my-project
  description: 项目描述

skills:
  brainstorming:
    enabled: true
    strictness: normal    # relaxed | normal | strict

  writing-plans:
    enabled: true

  execute-plan:
    enabled: true

  verification:
    enabled: true
    commands:
      - npm test
      - npm run lint

progress:
  auto_save: true
```

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

## 10. MVP 功能清单

- [ ] CLI 工具基础框架
- [ ] `supercraft init` 命令
- [ ] `supercraft status` 命令
- [ ] `supercraft task` 命令组
- [ ] `supercraft config` 命令组
- [ ] `supercraft spec` 命令组
- [ ] `supercraft template` 命令组
- [ ] 配置系统（全局 + 项目）
- [ ] 状态持久化
- [ ] 4 个核心技能

---

*文档状态：MVP 设计完成*
*最后更新：2026-02-18*
