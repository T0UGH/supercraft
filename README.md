# Supercraft

[![npm version](https://img.shields.io/npm/v/supercraft.svg)](https://www.npmjs.com/package/supercraft)
[![Build Status](https://img.shields.io/github/actions/workflow/status/T0UGH/supercraft/test.yml)](https://github.com/T0UGH/supercraft/actions)
[![Coverage](https://img.shields.io/codecov/c/github/T0UGH/supercraft)](https://codecov.io/gh/T0UGH/supercraft)
[![License](https://img.shields.io/github/license/T0UGH/supercraft)](LICENSE)

可定制的 AI 辅助开发工作流系统，为 Claude Code 提供配置注入、进度管理和技能扩展能力。

## 快速开始

```bash
# 1. 安装
npm install -g supercraft

# 2. 初始化项目
supercraft init

# 3. 创建任务
supercraft task create -t "实现用户认证" -p high

# 4. 开始工作
supercraft task start task-1
supercraft task complete task-1
```

## 目录

- [核心概念](#核心概念)
- [命令参考](#命令参考)
- [工作流示例](#工作流示例)
- [技能系统](#技能系统)
- [目录结构](#目录结构)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)

---

## 核心概念

### 配置系统

两级配置：全局 + 项目，项目配置优先级更高

```bash
# 全局配置
supercraft config set verification.commands "npm test" --global

# 项目配置
supercraft config set project.name "my-app"
```

### 任务管理

```
pending → in_progress → completed
   ↓                    ↑
   └── blocked ←────────┘
```

```bash
# 创建任务
supercraft task create -t "标题" -d "描述" -p high

# 状态流转
supercraft task start <id>
supercraft task complete <id>
supercraft task block <id> "原因"
supercraft task rollback <id>
```

### 快照系统

自动保存状态快照，支持随时回退

```bash
supercraft state snapshot          # 创建快照
supercraft state history          # 查看历史
supercraft state restore <file>   # 恢复
```

### 规范注入

将团队规范注入 AI 上下文

```bash
# 创建规范
echo "# 编码规范" > .supercraft/specs/coding-style.md

# 获取规范
supercraft spec get coding-style
```

### 模板系统

```bash
supercraft template list          # 列出模板
supercraft template show <name>  # 预览
supercraft template copy <name>  # 复制到本地
```

---

## 命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `supercraft init` | 初始化项目 |
| `supercraft status` | 查看状态 |

### 任务管理

| 命令 | 简写 | 说明 |
|------|------|------|
| `supercraft task list` | `task ls` | 列出任务 |
| `supercraft task create -t <title> -p <priority>` | `task add` | 创建任务 |
| `supercraft task start <id>` | `task start` | 开始任务 |
| `supercraft task complete <id>` | `task done` | 完成任务 |
| `supercraft task block <id> <reason>` | | 阻塞任务 |
| `supercraft task rollback <id>` | | 回退状态 |
| `supercraft task show <id>` | | 任务详情 |

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

### 规范与模板

| 命令 | 说明 |
|------|------|
| `supercraft spec list` | 列出规范 |
| `supercraft spec get <name>` | 获取规范 |
| `supercraft template list` | 列出模板 |
| `supercraft template show <name>` | 预览模板 |
| `supercraft template copy <name>` | 复制模板 |

---

## 工作流示例

### 完整功能开发流程

```
┌─────────────────────────────────────────────────────────────┐
│                      开发工作流                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │ 头脑风暴  │───▶│ 编写计划  │───▶│ 执行计划  │──┐        │
│   └──────────┘    └──────────┘    └──────────┘  │        │
│                                                ▼        │
│   ┌─────────────────────────────────────────────┐          │
│   │                 验证                        │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```bash
# 1. 头脑风暴
supercraft spec get coding-style
supercraft template copy design-doc

# 2. 编写计划
supercraft template copy plan

# 3. 执行计划
supercraft task create -t "任务1" -p high
supercraft task start task-1
# ... 实现功能 ...
supercraft task complete task-1

# 4. 验证
supercraft task list -s pending
supercraft state snapshot
```

### 团队配置

```bash
# 团队管理员设置全局配置
supercraft config set verification.commands "npm test" --global
supercraft config set verification.commands "npm run lint" --global

# 开发者初始化项目，自动继承全局配置
supercraft init
supercraft config list
```

---

## 技能系统

四个核心技能，规范开发流程：

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| `supercraft-brainstorming` | 头脑风暴 → 设计 | 新功能、组件开发 |
| `supercraft-writing-plans` | 需求 → 实施计划 | 有设计文档后 |
| `supercraft-execute-plan` | 计划 → 代码 | 按步骤执行 |
| `supercraft-verification` | 完成前验证 | 提交前检查 |

```bash
# 使用技能
/supercraft-brainstorming 设计用户认证模块
/supercraft-writing-plans
/supercraft-execute-plan
/supercraft-verification
```

---

## 目录结构

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

---

## 开发指南

```bash
# 克隆
git clone https://github.com/T0UGH/supercraft.git
cd supercraft

# 安装
npm install

# 开发
npm run dev      # 监听模式
npm run build    # 编译
npm test         # 测试
```

---

## 贡献指南

欢迎贡献！请先阅读 [贡献指南](CONTRIBUTING.md)。

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循项目现有代码风格
- 确保通过 `npm test`
- 更新相关文档

---

## 许可证

[MIT](LICENSE)
