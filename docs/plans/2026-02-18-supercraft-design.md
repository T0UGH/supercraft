# Supercraft 设计文档

> **创建时间**: 2026-02-18
> **状态**: 设计中
> **作者**: Claude Code & 用户协作

---

## 1. 项目概述

### 1.1 背景

Supercraft 是为解决 Superpowers 的核心痛点而设计的下一代 AI 辅助开发工作流系统。

**Superpowers 的核心痛点**：
1. **定制化困难** - 技能硬编码，无法根据项目特点灵活调整
2. **缺乏进度管理** - 无跨会话状态持久化，无任务追踪和可视化

### 1.2 核心目标

1. **继承 Superpowers 的精华**：最佳实践、质量保证、工作流设计
2. **补齐关键能力**：灵活定制、进度管理、项目隔离
3. **提供更好的体验**：降低门槛、支持团队、渐进式采用

### 1.3 关键决策

| 决策项 | 选择 |
|--------|------|
| MVP 范围 | 同时解决定制化和进度管理两个问题 |
| 目标平台 | 先支持 Claude Code，架构可扩展（可插拔设计） |
| 技能来源 | 混合：迁移核心技能 + 重新设计简化版本 |
| 进度可视化 | 纯命令行 CLI |
| 技能触发 | 沿用 Claude Code 现有机制（自动触发 + 显式触发） |
| 配置优先级 | 项目配置优先（项目可以覆盖全局设置） |
| 技术栈 | TypeScript |
| 架构方案 | 完全重构型（从零设计，无历史包袱） |

---

## 2. 项目结构

```
supercraft/
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── src/
│   ├── index.ts                  # 入口
│   ├── core/
│   │   ├── engine.ts             # 核心工作流引擎
│   │   ├── config.ts             # 配置管理
│   │   ├── state.ts              # 状态管理
│   │   └── template.ts           # 模板引擎
│   ├── platforms/
│   │   ├── base.ts               # 平台抽象接口
│   │   └── claude-code/
│   │       ├── index.ts          # Claude Code 适配器
│   │       └── hooks.ts          # 钩子实现
│   ├── skills/                   # 技能定义（精简版）
│   │   ├── brainstorming/
│   │   ├── test-driven-development/
│   │   ├── systematic-debugging/
│   │   ├── writing-plans/
│   │   └── verification/
│   └── cli/
│       ├── index.ts              # CLI 入口
│       ├── commands/             # CLI 命令
│       └── output.ts             # 输出格式化（进度条等）
├── templates/                    # 默认模板
│   ├── design-doc.md
│   └── plan.md
└── tests/
```

**关键设计点**：
- `core/` 包含核心逻辑，与平台无关
- `platforms/` 使用适配器模式，方便扩展
- `skills/` 重新设计精简版技能
- `cli/` 提供命令行界面和进度可视化

---

## 3. CLI 工具设计

### 3.1 职责定义

#### 做什么（核心职责）

| 职责 | 说明 |
|------|------|
| **项目初始化** | 在项目中创建 `.supercraft/` 目录和默认配置 |
| **配置管理** | 查看/修改项目或全局配置 |
| **状态查看** | 显示当前任务进度、历史记录 |
| **任务管理** | 创建、查看、更新任务状态 |
| **技能管理** | 列出可用技能、查看技能详情 |
| **模板管理** | 列出、创建、编辑模板 |

#### 不做什么（边界）

| 不做 | 原因 |
|------|------|
| **不执行技能** | 技能由 AI（Claude Code）执行，CLI 只是辅助 |
| **不生成代码** | 代码生成是 AI 的职责 |
| **不运行测试** | 使用项目现有的测试命令 |
| **不做 Git 操作** | 由用户或 AI 决定何时提交 |
| **不启动服务器** | 不是运行时工具 |

### 3.2 命令设计

```
supercraft <command> [options]

Commands:
  init              初始化项目（创建 .supercraft/ 目录）

  config            配置管理
    config list     列出当前配置
    config get <key>      获取配置项
    config set <key> <value>  设置配置项

  status            查看当前项目状态和进度

  task              任务管理
    task list       列出所有任务
    task show <id>  显示任务详情
    task create     创建新任务（交互式）
    task start <id> 开始执行任务
    task complete <id>  标记任务完成
    task block <id> <reason>  标记任务阻塞

  skill             技能管理
    skill list      列出可用技能
    skill show <name>  显示技能详情

  template          模板管理
    template list   列出可用模板
    template show <name>  显示模板内容

  history           查看历史记录
    history list    列出历史会话
    history show <id>  显示历史详情

Options:
  --global          操作全局配置（而非项目配置）
  --json            JSON 格式输出
  --help, -h        显示帮助
```

### 3.3 核心命令详解

#### `supercraft init`

初始化项目，创建以下结构：
```
.supercraft/
├── config.yaml     # 项目配置
├── state.json      # 任务状态
└── templates/      # 自定义模板（可选）
```

#### `supercraft status`

显示项目当前状态：
```
Project: my-project
Current Plan: feature-auth
Progress: ████████░░ 80% (4/5 tasks)

Tasks:
  ✓ task-1: 实现登录 API
  ✓ task-2: 添加登录表单
  ✓ task-3: 集成认证中间件
  ● task-4: 编写集成测试 (in progress)
  ○ task-5: 更新文档

Last updated: 2026-02-18 10:30
```

#### `supercraft task list`

列出所有任务：
```
ID    Title              Status      Started              Completed
1     实现登录 API        completed   2026-02-18 09:00     2026-02-18 10:30
2     添加登录表单        completed   2026-02-18 10:35     2026-02-18 11:00
3     集成认证中间件      completed   2026-02-18 11:05     2026-02-18 11:30
4     编写集成测试        in_progress 2026-02-18 11:35     -
5     更新文档           pending     -                    -
```

#### `supercraft skill list`

列出可用技能：
```
Skill                     Description
brainstorming             在开始创造性工作前进行设计和需求分析
test-driven-development   强制执行严格的 TDD 流程
systematic-debugging      系统化的调试方法
writing-plans             将设计文档转换为详细的实施计划
verification              完成前验证工作
```

---

## 4. 核心解决思路

### 4.1 解决"定制化困难"的思路

**问题本质**：Superpowers 的技能内容硬编码在 SKILL.md 文件中，用户只能"全有或全无"——要么完全使用默认技能，要么创建完整的覆盖文件。

**解决方案：三层解耦**

```
┌─────────────────────────────────────────────────────────────┐
│                    定制化解决方案                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │  配置层      │     │  模板层      │     │  技能层      │   │
│   │  (Config)   │     │  (Template) │     │  (Skill)    │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  合并引擎      │                        │
│                    │  (Merge)      │                        │
│                    └───────────────┘                        │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  最终技能内容  │                        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

| 层级 | 作用 | 示例 |
|------|------|------|
| **配置层** | 调整技能参数，不改变技能内容 | `strictness: relaxed` |
| **模板层** | 自定义输出格式（设计文档、计划等） | 自定义设计文档模板 |
| **技能层** | 完整覆盖技能内容（最后的手段） | 完全重写 brainstorming |

**核心创新**：
- **配置驱动**：通过 YAML 配置调整技能行为，无需修改技能文件
- **模板分离**：技能中的模板（如设计文档格式）独立出来，可单独定制
- **渐进定制**：先用配置，不够再用模板，最后才覆盖技能

### 4.2 解决"缺乏进度管理"的思路

**问题本质**：每次 AI 会话都是独立的，任务状态不持久化，无法追踪进度、恢复中断的工作。

**解决方案：状态持久化 + CLI 可视化**

```
┌─────────────────────────────────────────────────────────────┐
│                    进度管理解决方案                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   状态持久化层                        │   │
│   │  .supercraft/state.json                              │   │
│   └─────────────────────────────────────────────────────┘   │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│   │  任务管理  │     │  进度可视化 │     │  历史记录  │        │
│   │           │     │           │     │           │        │
│   └───────────┘     └───────────┘     └───────────┘        │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  CLI 工具      │                        │
│                    │  (查看/操作)   │                        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

| 能力 | 作用 | 实现方式 |
|------|------|----------|
| **状态持久化** | 任务状态保存到文件，跨会话保持 | `state.json` |
| **进度可视化** | CLI 输出进度条、任务列表 | `supercraft status` |
| **历史记录** | 保存历史会话，可回溯 | `.supercraft/history/` |

**核心创新**：
- **AI 可读写状态**：AI 执行任务时，通过工具读取和更新状态
- **断点恢复**：会话中断后，AI 可从 state.json 读取当前进度，继续执行
- **CLI 辅助**：用户可通过 CLI 查看进度、手动调整任务状态

### 4.3 两个问题的关联

```
┌─────────────────────────────────────────────────────────────┐
│                      Supercraft 整体架构                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │                    AI (Claude Code)                  │  │
│    │         读取配置 → 执行技能 → 更新状态                │  │
│    └─────────────────────────────────────────────────────┘  │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐        │
│   │  配置系统  │     │  技能系统  │     │  状态系统  │        │
│   │ (定制化)  │     │ (工作流)   │     │ (进度管理) │        │
│   └───────────┘     └───────────┘     └───────────┘        │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                                │
│                    ┌───────▼───────┐                        │
│                    │  CLI 工具      │  ← 用户操作入口        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**关键点**：
1. **配置系统** 让 AI 知道"按什么规则"执行技能
2. **状态系统** 让 AI 知道"当前进度"，并能"更新进度"
3. **CLI 工具** 让用户能"查看"和"管理"配置和状态

---

## 5. 配置系统设计

### 5.1 配置层级

```
┌─────────────────────────────────────────────┐
│  全局配置 (~/.supercraft/config.yaml)        │  ← 最低优先级
├─────────────────────────────────────────────┤
│  项目配置 (.supercraft/config.yaml)          │  ← 覆盖全局
├─────────────────────────────────────────────┤
│  环境变量 (SUPERCRAFT_*)                     │  ← 覆盖项目配置
└─────────────────────────────────────────────┘
```

### 5.2 配置文件结构

```yaml
# .supercraft/config.yaml

# 项目基本信息
project:
  name: my-project
  description: 项目描述

# 技能配置
skills:
  # 头脑风暴
  brainstorming:
    enabled: true
    strictness: normal    # relaxed | normal | strict
    required_steps:       # 必须完成的步骤
      - explore
      - design

  # TDD
  test-driven-development:
    enabled: true
    strictness: normal
    auto_commit: false

  # 系统化调试
  systematic-debugging:
    enabled: true
    require_root_cause: true

  # 编写计划
  writing-plans:
    enabled: true
    template: default     # 使用的模板名称

  # 完成前验证
  verification:
    enabled: true
    commands:
      - npm test
      - npm run lint

# 模板配置
templates:
  design-doc: default
  plan: default

# 进度配置
progress:
  auto_save: true
  history_enabled: true
```

### 5.3 配置合并逻辑

```typescript
interface Config {
  project?: ProjectConfig;
  skills: SkillsConfig;
  templates: TemplatesConfig;
  progress: ProgressConfig;
}

// 合并顺序：默认 < 全局 < 项目 < 环境变量
function mergeConfig(...configs: Partial<Config>[]): Config {
  return deepMerge(defaultConfig, ...configs);
}
```

### 5.4 配置验证

使用 JSON Schema 验证配置文件格式：

```typescript
const configSchema = {
  type: 'object',
  properties: {
    project: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' }
      }
    },
    skills: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          enabled: { type: 'boolean', default: true },
          strictness: { enum: ['relaxed', 'normal', 'strict'] }
        }
      }
    }
  }
};
```

---

## 6. 状态管理设计

### 6.1 状态文件结构

```json
// .supercraft/state.json
{
  "version": "1.0",
  "project": {
    "name": "my-project",
    "root": "/path/to/project"
  },
  "current": {
    "plan_id": "plan-2026-02-18-auth",
    "plan_name": "用户认证功能",
    "phase": "implementation"
  },
  "tasks": [
    {
      "id": "task-1",
      "title": "实现登录 API",
      "description": "创建登录接口，支持用户名密码登录",
      "status": "completed",
      "priority": "high",
      "created_at": "2026-02-18T09:00:00Z",
      "started_at": "2026-02-18T09:00:00Z",
      "completed_at": "2026-02-18T10:30:00Z",
      "blocked_reason": null
    },
    {
      "id": "task-2",
      "title": "添加登录表单",
      "description": "前端登录页面和表单验证",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2026-02-18T09:00:00Z",
      "started_at": "2026-02-18T10:35:00Z",
      "completed_at": null,
      "blocked_reason": null
    },
    {
      "id": "task-3",
      "title": "集成认证中间件",
      "status": "pending",
      "priority": "medium",
      "created_at": "2026-02-18T09:00:00Z",
      "started_at": null,
      "completed_at": null,
      "blocked_reason": null
    }
  ],
  "metrics": {
    "total_tasks": 3,
    "completed": 1,
    "in_progress": 1,
    "pending": 1,
    "blocked": 0,
    "progress_percent": 33
  },
  "metadata": {
    "created_at": "2026-02-18T09:00:00Z",
    "updated_at": "2026-02-18T10:35:00Z",
    "last_session_id": "session-abc123"
  }
}
```

### 6.2 任务状态定义

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 待处理 | `in_progress`, `blocked` |
| `in_progress` | 进行中 | `completed`, `blocked` |
| `completed` | 已完成 | - |
| `blocked` | 被阻塞 | `pending`, `in_progress` |

### 6.3 状态管理 API

```typescript
interface StateManager {
  // 读取状态
  load(): Promise<State>;
  save(state: State): Promise<void>;

  // 任务操作
  createTask(task: Omit<Task, 'id'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // 批量操作
  getTasks(filter?: TaskFilter): Promise<Task[]>;
  getMetrics(): Promise<Metrics>;

  // 历史记录
  archiveHistory(): Promise<void>;
  loadHistory(date: string): Promise<State>;
}
```

### 6.4 AI 与状态的交互

AI 通过工具函数与状态系统交互：

```typescript
// AI 可调用的工具函数
const stateTools = {
  // 获取当前进度
  supercraft_status: {
    description: "获取当前项目的任务进度和状态",
    handler: async () => stateManager.load()
  },

  // 更新任务状态
  supercraft_task_update: {
    description: "更新任务状态",
    parameters: {
      task_id: "任务ID",
      status: "新状态",
      note: "备注（可选）"
    },
    handler: async (params) => stateManager.updateTask(params.task_id, {
      status: params.status,
      note: params.note
    })
  },

  // 创建任务
  supercraft_task_create: {
    description: "创建新任务",
    parameters: {
      title: "任务标题",
      description: "任务描述",
      priority: "优先级"
    },
    handler: async (params) => stateManager.createTask(params)
  }
};
```

---

## 7. 技能系统设计

### 7.1 设计原则

**MVP 版本保持简单**：
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
description: "Use when starting any creative work - creating features, building components, adding functionality"
---
```

### 7.4 技能内容示例

```markdown
# Brainstorming: 将想法转化为设计

## 概述
帮助用户通过自然对话将想法转化为完整的设计和规格。

## 配置说明
本技能支持以下配置项（在 config.yaml 中设置）：
- `strictness`: 控制流程严格程度
  - `relaxed`: 简化流程，适合小任务
  - `normal`: 标准流程
  - `strict`: 严格流程，包含所有检查点
- `required_steps`: 必须完成的步骤

AI 应根据当前配置决定执行方式。

## 工作流程

### 步骤 1: 探索项目上下文
...（技能内容）

### 步骤 2: 提出澄清问题
...（技能内容）

### 步骤 3: 提出方案
...（技能内容）
```

### 7.5 配置如何影响技能

会话启动时，注入两个独立的内容：

```
┌─────────────────────────────────────────────────────────────┐
│  注入给 AI 的内容                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. 技能内容（静态 Markdown）                               │
│   2. 项目配置（config.yaml 内容）                            │
│                                                              │
│   AI 读取配置后，自己决定如何执行技能                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 MVP 核心技能列表

| 技能 | 功能 | 从 Superpowers 迁移/重新设计 |
|------|------|------------------------------|
| `brainstorming` | 头脑风暴，设计转化 | 简化版重新设计 |
| `test-driven-development` | TDD 流程 | 迁移核心，简化严格度 |
| `systematic-debugging` | 系统化调试 | 迁移核心流程 |
| `writing-plans` | 编写实施计划 | 简化版重新设计 |
| `verification` | 完成前验证 | 简化版重新设计 |

---

## 8. 规范注入与文档模板系统

### 8.1 核心思路

**区分两个概念**：

| 概念 | 用途 | 来源 |
|------|------|------|
| **用户规范/配置** | 代码风格、技术栈偏好、团队约定等 | 用户自定义文件 |
| **文档模板** | 生成文档的结构和格式 | 默认模板 + 用户自定义 |

**关键设计**：Skills 执行时，先调用 CLI 获取用户规范/模板内容，然后注入到 AI 上下文中。

### 8.2 Skill → CLI 调用模式

```
┌─────────────────────────────────────────────────────────────┐
│                    Skill 执行流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. Skill 被触发                                            │
│          │                                                   │
│          ▼                                                   │
│   2. 调用 CLI 获取用户规范/模板                               │
│      $ supercraft spec get <type>                            │
│      $ supercraft template render <name>                     │
│          │                                                   │
│          ▼                                                   │
│   3. 将获取的内容注入 AI 上下文                               │
│          │                                                   │
│          ▼                                                   │
│   4. AI 基于规范/模板执行 Skill 逻辑                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 具体场景

#### 场景 1: execute-plan skill

```
execute-plan skill 执行流程:
1. 调用: supercraft spec get coding-style
2. CLI 返回: 用户定义的代码规范内容
3. 注入到 AI 上下文
4. AI 按照用户规范编写实施计划
```

用户规范文件示例 (`.supercraft/specs/coding-style.md`):
```markdown
# 代码规范

## 命名约定
- 变量使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 类和组件使用 PascalCase

## 错误处理
- 所有 API 调用必须有错误处理
- 使用统一的错误类型

## 测试
- 单元测试覆盖率 > 80%
- 集成测试覆盖核心流程
```

#### 场景 2: brainstorming skill

```
brainstorming skill 执行流程:
1. 调用: supercraft template render design-doc
2. CLI 根据模板生成草稿
3. 将草稿注入 AI 上下文
4. AI 通过对话逐步完善草稿内容
```

设计文档模板示例 (`.supercraft/templates/design-doc.md`):
```markdown
# {title} 设计文档

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
```

### 8.4 CLI 新增命令

```
# 规范管理
supercraft spec
  spec list                      列出所有规范
  spec get <name>                获取规范内容（供 AI 读取）
  spec edit <name>               编辑规范（打开编辑器）

# 模板管理
supercraft template
  template list                  列出可用模板
  template show <name>           显示模板内容
  template render <name>         根据模板生成草稿
  template edit <name>           编辑模板
```

### 8.5 目录结构更新

```
.supercraft/
├── config.yaml          # 项目配置
├── state.yaml           # 任务状态
├── specs/               # 用户规范（新增）
│   ├── coding-style.md
│   ├── api-design.md
│   └── testing.md
├── templates/           # 文档模板（新增）
│   ├── design-doc.md
│   ├── plan.md
│   └── pr-description.md
└── history/             # 历史记录
```

### 8.6 Skill 如何使用规范/模板

**方式 1: 显式调用（推荐）**

Skill 内容中明确指导 AI 调用 CLI:

```markdown
# execute-plan Skill

## 前置步骤
在开始编写实施计划之前，先获取用户的代码规范：

\`\`\`
执行: supercraft spec get coding-style
\`\`\`

将返回的规范内容注入上下文，然后按照规范编写实施计划。

## 主要流程
...
```

**方式 2: 通过 Session Hook 自动注入**

在会话启动时自动注入:

```typescript
// hooks.json
{
  "sessionStart": "supercraft spec get --all"
}
```

### 8.7 MVP 范围

| 功能 | MVP | 后续版本 |
|------|-----|----------|
| 用户规范目录 | ✅ | |
| `spec get` 命令 | ✅ | |
| `spec list` 命令 | ✅ | |
| 文档模板目录 | ✅ | |
| `template show` 命令 | ✅ | |
| `template render` 命令 | ❌ | v0.2.0 |
| 模板变量替换 | ❌ | v0.2.0 |
| Session Hook 自动注入 | ❌ | v0.2.0 |

---

## 9. 平台适配层设计

### 9.1 平台抽象接口

```typescript
interface PlatformAdapter {
  // 平台标识
  name: string;
  version: string;

  // 技能发现
  discoverSkills(): Promise<Skill[]>;

  // 钩子系统
  getHooks(): HookConfig;

  // 上下文注入
  injectContext(content: string): Promise<void>;

  // 工具注册
  registerTools(tools: Tool[]): Promise<void>;

  // 事件监听
  on(event: PlatformEvent, handler: EventHandler): void;
}

interface HookConfig {
  sessionStart?: () => Promise<string>;
  sessionEnd?: () => Promise<void>;
  beforeSkillInvoke?: (skill: Skill) => Promise<void>;
  afterSkillInvoke?: (skill: Skill, result: any) => Promise<void>;
}
```

### 9.2 Claude Code 适配器

```typescript
class ClaudeCodeAdapter implements PlatformAdapter {
  name = 'claude-code';

  // Claude Code 的技能发现
  async discoverSkills(): Promise<Skill[]> {
    // 扫描 skills/ 目录
    // 解析 SKILL.md 的 frontmatter
    // 返回技能列表
  }

  // Claude Code 的钩子配置
  getHooks(): HookConfig {
    return {
      sessionStart: async () => {
        // 生成引导内容，注入到 system prompt
        const config = await this.loadConfig();
        const state = await this.loadState();
        return this.generateBootstrapContent(config, state);
      }
    };
  }

  // 注入上下文到 Claude Code
  async injectContext(content: string): Promise<void> {
    // 使用 Claude Code 的 context API
    // 或通过 hooks.json 配置
  }
}
```

### 9.3 扩展到其他平台

```typescript
// Codex 适配器（未来）
class CodexAdapter implements PlatformAdapter {
  name = 'codex';
  // 实现 Codex 特定的逻辑
}

// OpenCode 适配器（未来）
class OpenCodeAdapter implements PlatformAdapter {
  name = 'opencode';
  // 实现 OpenCode 特定的逻辑
}
```

### 9.4 平台检测与加载

```typescript
function detectPlatform(): PlatformAdapter {
  // 检测当前运行环境
  if (process.env.CLAUDE_CODE) {
    return new ClaudeCodeAdapter();
  }
  if (process.env.CODEX) {
    return new CodexAdapter();
  }
  throw new Error('Unknown platform');
}
```

---

## 10. 测试策略

### 10.1 单元测试

| 模块 | 测试重点 |
|------|----------|
| `core/config` | 配置加载、合并、验证 |
| `core/state` | 状态 CRUD、持久化 |
| `core/template` | 模板渲染、变量替换 |
| `cli/commands` | 命令解析、输出格式 |

### 10.2 集成测试

| 场景 | 测试内容 |
|------|----------|
| 项目初始化 | `supercraft init` 创建正确的目录结构 |
| 配置生效 | 配置修改后技能行为变化 |
| 状态持久化 | 跨会话状态保持一致 |
| 模板渲染 | 模板正确应用到技能输出 |

### 10.3 E2E 测试

```bash
# 模拟完整工作流
1. supercraft init
2. 修改配置
3. AI 执行技能
4. supercraft status 验证状态
5. supercraft task complete
6. 验证状态更新
```

### 10.4 测试工具

- **Jest**: 单元测试和集成测试
- **tsx**: TypeScript 执行
- **临时目录**: 每个测试用例隔离的文件系统

---

## 11. 发布计划

### 11.1 MVP 范围（v0.1.0）

**核心功能**：
- [ ] CLI 工具基础框架
- [ ] `supercraft init` 命令
- [ ] `supercraft status` 命令
- [ ] `supercraft task` 命令组
- [ ] `supercraft config` 命令组
- [ ] 配置系统（全局 + 项目）
- [ ] 状态持久化
- [ ] Claude Code 平台适配
- [ ] 3 个核心技能（brainstorming, writing-plans, verification）

### 11.2 后续版本

**v0.2.0**：
- [ ] 模板系统
- [ ] 更多技能（TDD, systematic-debugging）
- [ ] `supercraft skill` 命令
- [ ] `supercraft template` 命令
- [ ] 历史记录功能

**v0.3.0**：
- [ ] 技能配置验证
- [ ] 技能热重载
- [ ] 性能优化

**v1.0.0**：
- [ ] 稳定 API
- [ ] 完整文档
- [ ] Codex 适配器（可选）

### 11.3 发布渠道

- **npm**: `npm install -g supercraft`
- **GitHub Releases**: 源码和 CHANGELOG

---

## 12. 待讨论/决策的问题

1. **状态文件格式**: JSON vs YAML？ → **已决定：YAML**
2. **模板/规范系统**: 是否需要模板引擎？ → **已决定：采用 CLI 调用模式**
3. **技能版本控制**: 如何处理技能升级？
4. **多语言支持**: 是否支持中文技能内容？
5. **团队协作**: 如何共享配置？（Git vs 中心化存储）

### 12.1 已决策内容

#### 状态文件格式：YAML
- 更易读
- 支持注释
- 便于手动编辑

#### 模板/规范系统：CLI 调用模式
- **Skills 是静态 Markdown 文件**，不使用模板引擎
- **用户规范**：存放于 `.supercraft/specs/`，通过 CLI 读取后注入上下文
- **文档模板**：存放于 `.supercraft/templates/`，用于生成草稿结构
- **调用模式**：Skill 执行时先调用 CLI 获取规范/模板，再注入 AI 上下文
- 写新 Skills 本身就很快，不需要模板引擎动态化

**核心洞察**：
- 规范/配置是"用户想注入 AI 上下文的内容"
- 模板是"生成文档的结构"
- Skills 通过调用 CLI 获取这些内容，而不是在 Skill 内部处理模版逻辑

---

*文档状态：设计中，持续更新*
*最后更新：2026-02-18*
