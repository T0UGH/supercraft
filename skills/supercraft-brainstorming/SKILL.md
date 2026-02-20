---
name: supercraft-brainstorming
description: "Use when starting any creative work - creating features, building components, adding functionality"
---

# Supercraft Brainstorming: 将想法转化为设计

## 概述

帮助用户通过自然对话将想法转化为完整的设计和规格。

## 前置步骤

1. **获取用户规范**（如果需要）：
   ```bash
   supercraft spec get coding-style
   ```
   将返回的规范内容用于后续工作。

2. **创建设计文档**：
   ```bash
   supercraft template copy design-doc
   ```
   这会在 `docs/plans/` 目录创建一个设计文档副本。

## 工作流程

### 步骤 1: 探索项目上下文

- 检查项目文件结构
- 查看最近提交
- 了解现有架构

### 步骤 2: 提出澄清问题

- 一次只问一个问题
- 理解目的、约束、成功标准
- 使用多选题形式（如果适用）

### 步骤 3: 提出方案

- 提出 2-3 种不同的方案
- 说明各方案的权衡
- 给出推荐方案和理由

### 步骤 4: 呈现设计

- 按部分呈现设计
- 每个部分后确认是否正确
- 覆盖：架构、组件、数据流、错误处理、测试

### 步骤 5: 保存设计文档

- 将设计保存到 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 提交到 git

## 设计文档结构

```markdown
# [主题] 设计文档

> **创建时间**: YYYY-MM-DD
> **状态**: 草稿/评审中/已批准

## 1. 概述
- 背景
- 目标
- 范围

## 2. 技术方案
- 架构设计
- 组件设计
- 数据流

## 3. API 设计
- 接口定义
- 数据结构

## 4. 测试策略
- 单元测试
- 集成测试

## 5. 实施计划
- 任务分解
- 里程碑
```

## 关键原则

- **一个问题一次** - 不要用多个问题淹没用户
- **YAGNI** - 只设计需要的功能
- **渐进式验证** - 每个部分后确认
- **保持灵活** - 随时可以回退澄清
