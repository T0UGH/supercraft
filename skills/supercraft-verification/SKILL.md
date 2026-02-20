---
name: supercraft-verification
description: "Use when about to claim work is complete, before committing or creating PRs"
---

# Supercraft Verification: 完成前验证

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
