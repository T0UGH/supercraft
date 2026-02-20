# Supercraft

可定制的 AI 辅助开发工作流系统，为 Claude Code 提供配置注入、进度管理和技能扩展能力。

## 什么是 Supercraft？

Supercraft 是一个 Claude Code 插件，帮助你：

- **管理项目配置**：全局配置 + 项目配置，自动合并
- **跟踪任务进度**：创建任务、标记状态、计算进度百分比
- **创建快照回退**：自动保存状态快照，支持随时回退
- **注入规范**：将团队编码规范注入 AI 上下文
- **使用模板**：快速复制设计文档、实施计划模板
- **结构化工作流**：通过技能（skills）规范开发流程

## 安装

```bash
# 通过 Claude Code 安装
/plugins install T0UGH/supercraft
```

## 快速开始

```bash
# 1. 初始化项目
supercraft init

# 2. 查看状态
supercraft status

# 3. 创建第一个任务
supercraft task create -t "实现用户认证" -p high

# 4. 开始任务
supercraft task start task-1

# 5. 完成任务
supercraft task complete task-1
```

## 核心概念

### 1. 配置系统

Supercraft 支持两级配置：

```bash
# 全局配置（~/.supercraft/config.yaml）
supercraft config set verification.commands "npm test" --global

# 项目配置（.supercraft/config.yaml）
supercraft config set project.name "my-app"
```

配置优先级：项目配置 > 全局配置

### 2. 任务管理

任务状态流转：

```
pending → in_progress → completed
   ↓                    ↑
   └── blocked ←────────┘
```

关键命令：

```bash
# 创建任务
supercraft task create -t "标题" -d "描述" -p high

# 状态流转
supercraft task start <id>      # 开始
supercraft task complete <id>   # 完成
supercraft task block <id> "原因"  # 阻塞
supercraft task rollback <id>   # 回退

# 查看
supercraft task list
supercraft task list -s pending      # 筛选
supercraft task show <id>
```

### 3. 快照系统

每次状态变更自动创建快照，支持回退到任意历史状态：

```bash
supercraft state snapshot    # 手动创建快照
supercraft state history    # 查看历史
supercraft state restore <file>  # 恢复
```

### 4. 规范注入

将团队规范注入 AI 上下文，确保 AI 遵循团队约定：

```bash
# 创建规范
echo "# 编码规范" > .supercraft/specs/coding-style.md

# 获取规范（注入 AI 上下文）
supercraft spec get coding-style
```

### 5. 模板系统

快速创建标准文档：

```bash
# 列出可用模板
supercraft template list

# 预览模板
supercraft template show design-doc

# 复制到本地
supercraft template copy design-doc
supercraft template copy plan -o docs/plans -n my-plan.md
```

## 技能系统

Supercraft 提供 4 个核心技能，规范开发流程：

### supercraft-brainstorming

头脑风暴，将想法转化为设计。

```
使用场景：当你需要新功能、组件或任何创造性工作时
```

### supercraft-writing-plans

编写实施计划，将需求分解为可执行步骤。

```
使用场景：当你有设计文档或需求，需要创建实施计划时
```

### supercraft-execute-plan

执行实施计划，逐任务完成开发。

```
使用场景：当你有实施计划，需要按步骤执行时
```

### supercraft-verification

完成前验证，确保工作质量。

```
使用场景：当你声称工作完成，需要验证时
```

## 完整命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `supercraft init` | 初始化项目 |
| `supercraft status` | 查看状态 |

### 任务管理

| 命令 | 说明 |
|------|------|
| `supercraft task list` | 列出任务 |
| `supercraft task list -s <status>` | 按状态筛选 |
| `supercraft task show <id>` | 任务详情 |
| `supercraft task create -t <title> -p <priority>` | 创建任务 |
| `supercraft task start <id>` | 开始任务 |
| `supercraft task complete <id>` | 完成任务 |
| `supercraft task block <id> <reason>` | 阻塞任务 |
| `supercraft task rollback <id>` | 回退任务 |

### 状态管理

| 命令 | 说明 |
|------|------|
| `supercraft state snapshot` | 创建快照 |
| `supercraft state history` | 查看历史 |
| `supercraft state restore <file>` | 恢复快照 |

### 配置管理

| 命令 | 说明 |
|------|------|
| `supercraft config list` | 列出配置 |
| `supercraft config list --global` | 全局配置 |
| `supercraft config get <key>` | 获取配置 |
| `supercraft config set <key> <value>` | 设置配置 |
| `supercraft config set <key> <value> --global` | 全局配置 |

### 规范管理

| 命令 | 说明 |
|------|------|
| `supercraft spec list` | 列出规范 |
| `supercraft spec get <name>` | 获取规范内容 |

### 模板管理

| 命令 | 说明 |
|------|------|
| `supercraft template list` | 列出模板 |
| `supercraft template show <name>` | 预览模板 |
| `supercraft template copy <name>` | 复制模板 |
| `supercraft template copy <name> -o <dir> -n <file>` | 指定输出 |

## 目录结构

初始化后，项目根目录会创建 `.supercraft/` 目录：

```
.supercraft/
├── config.yaml      # 项目配置
├── state.yaml       # 任务状态
├── history/         # 状态快照
│   └── 2026-02-20T10-00-00.yaml
├── specs/           # 用户规范
│   └── coding-style.md
└── templates/       # 文档模板
    ├── design-doc.md
    └── plan.md
```

## 工作流示例

### 完整功能开发流程

```bash
# 1. 头脑风暴
/supercraft spec get coding-style  # 获取规范
supercraft template copy design-doc  # 创建设计文档

# 2. 编写计划
supercraft template copy plan  # 创建计划模板

# 3. 执行计划
supercraft task create -t "任务1" -p high
supercraft task start task-1
# ... 实现功能 ...
supercraft task complete task-1

# 4. 验证
supercraft task list -s pending
supercraft state snapshot
```

### 团队配置示例

```bash
# 团队管理员设置全局配置
supercraft config set verification.commands "npm test" --global
supercraft config set verification.commands "npm run lint" --global

# 开发者在项目中初始化
supercraft init
# 自动继承全局配置
supercraft config list
```

## 开发

```bash
# 克隆项目
git clone https://github.com/T0UGH/supercraft.git
cd supercraft

# 安装依赖
npm install

# 编译
npm run build

# 测试
npm test
```

## 使用流程

每个项目首次使用需要初始化：

```bash
# 1. 进入项目目录
cd your-project

# 2. 初始化 supercraft（创建 .supercraft/ 目录和默认配置）
supercraft init

# 3. 之后即可使用其他命令
supercraft status
supercraft task create -t "任务1" -p high
```

## 许可证

MIT
