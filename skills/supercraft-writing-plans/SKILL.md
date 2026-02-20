---
name: supercraft-writing-plans
description: "Use when you have a spec or requirements and need to create an implementation plan"
---

# Supercraft Writing Plans: 编写实施计划

## 概述

根据设计文档或需求编写详细的实施计划，将大任务分解为可执行的小步骤。

**开场声明：** "我正在使用 writing-plans 技能来创建实施计划。"

**上下文：** 应在独立 worktree 中运行（由 brainstorming 技能创建）。

## 前置步骤

1. **获取用户规范**（如果需要）：
   ```bash
   supercraft spec list  # 查看可用规范
   supercraft spec get <规范名>  # 获取规范内容
   ```

2. **创建计划文档**：
   ```bash
   supercraft template list  # 查看可用模板
   supercraft template copy plan  # 复制计划模板
   ```

## 检查清单

必须按顺序完成以下每个项目：

1. **理解需求** — 阅读设计文档、技术方案、确认约束
2. **分解任务** — 2-5 分钟可完成的粒度
3. **创建任务** — 使用 supercraft task create
4. **保存计划** — 提交到 git
5. **执行交接** — 让用户选择执行方式

## 工作流程

### 步骤 1: 理解需求

- 阅读设计文档
- 理解技术方案
- 确认约束条件

### 步骤 2: 分解任务

**每个步骤是一个动作（2-5 分钟）：**
- "编写失败的测试" - 步骤
- "运行测试确认失败" - 步骤
- "实现最小代码让测试通过" - 步骤
- "运行测试确认通过" - 步骤
- "提交" - 步骤

### 步骤 3: 创建任务到状态系统

```bash
# 创建任务
supercraft task create -t "任务标题" -d "任务描述" -p high

# 查看任务
supercraft task list
```

### 步骤 4: 保存计划

保存到 `docs/plans/YYYY-MM-DD-<feature>.md`，提交到 git。

### 步骤 5: 执行交接

**计划完成后，提供两个执行选项，使用 AskUserQuestion 让用户选择：**

```
使用 AskUserQuestion 询问：
- "计划已保存。有两种执行方式，你想要哪种？"
- 选项：
  - Subagent-Driven（当前会话）：我为每个任务调度子 agent，任务间进行 code review，快速迭代
  - Parallel Session（单独会话）：在新会话中使用 executing-plans，批量执行并设置检查点
```

**如果选择 Subagent-Driven：**
- 使用 superpowers:subagent-driven-development 技能
- 保持在当前会话
- 每个任务一个子 agent + code review

**如果选择 Parallel Session：**
- 引导用户在 worktree 中打开新会话
- 新会话使用 superpowers:executing-plans 技能

## 计划文档结构

使用 supercraft plan 模板，包含以下头部：

```markdown
# [功能名称] 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [一句话描述目标]

**Architecture:** [2-3 句描述架构]

**Tech Stack:** [关键技术/库]

---
```

## 任务模板

```markdown
### Task N: [组件名称]

**Files:**
- Create: `exact/path/to/file.ts`
- Modify: `exact/path/to/existing.ts:123-145`
- Test: `tests/exact/path/to/test.ts`

**Step 1: 编写失败的测试**

```typescript
describe('function', () => {
  it('should do something', () => {
    expect(function(input)).toBe(expected);
  });
});
```

**Step 2: 运行测试确认失败**

Run: `npm test tests/path/test.ts`
Expected: FAIL with "function is not defined"

**Step 3: 编写最小实现**

```typescript
function function(input): expected {
  return expected;
}
```

**Step 4: 运行测试确认通过**

Run: `npm test tests/path/test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.ts src/path/file.ts
git commit -m "feat: add specific feature"
```

---

## 记住

- 始终使用精确的文件路径
- 在计划中包含完整代码（不是"添加验证"）
- 包含具体命令和预期输出
- DRY, YAGNI, TDD, 频繁提交
- 使用 supercraft 任务管理跟踪进度
