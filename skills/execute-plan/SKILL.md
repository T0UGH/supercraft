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
3. 调用 verification 技能验证
