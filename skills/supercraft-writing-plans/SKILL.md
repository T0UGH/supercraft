---
name: supercraft-writing-plans
description: "Use when you have a spec or requirements and need to create an implementation plan"
---

# Supercraft Writing Plans: 编写实施计划

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

1. **Subagent-Driven（当前会话）** - 使用 subagent-driven-development 技能
2. **Parallel Session（单独会话）** - 在新会话中使用 executing-plans 技能
