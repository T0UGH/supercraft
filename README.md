# Supercraft

可定制的 AI 辅助开发工作流系统，为 Claude Code 提供配置注入和进度管理能力。

## 安装

```bash
# 通过 Claude Code 安装
/plugins install T0UGH/supercraft
```

## 快速开始

```bash
# 初始化项目
supercraft init

# 查看状态
supercraft status
```

## CLI 命令

### 基础命令

```bash
supercraft init              # 初始化项目
supercraft status            # 查看当前状态
```

### 任务管理

```bash
supercraft task list         # 列出所有任务
supercraft task list -s in_progress  # 按状态筛选
supercraft task show <id>    # 显示任务详情
supercraft task create -t "标题" -p high  # 创建任务
supercraft task start <id>   # 开始任务
supercraft task complete <id>  # 完成任务
supercraft task block <id> "原因"  # 阻塞任务
supercraft task rollback <id>  # 回退任务
```

### 状态管理

```bash
supercraft state snapshot    # 创建快照
supercraft state history     # 查看历史快照
supercraft state restore <file>  # 恢复快照
```

### 配置管理

```bash
supercraft config list       # 列出配置
supercraft config get project.name  # 获取配置项
supercraft config set project.name "my-app"  # 设置配置
supercraft config set verification.commands "npm test" --global  # 全局配置
```

### 规范管理（知识类）

```bash
supercraft spec list         # 列出规范
supercraft spec get coding-style  # 获取规范内容（注入 AI 上下文）
```

### 模板管理（模板类）

```bash
supercraft template list     # 列出模板
supercraft template show design-doc  # 预览模板
supercraft template copy design-doc  # 复制模板到本地
supercraft template copy plan -o docs/plans -n my-plan.md  # 指定输出
```

## 技能

- **supercraft-brainstorming**: 头脑风暴，将想法转化为设计
- **supercraft-writing-plans**: 编写实施计划
- **supercraft-execute-plan**: 执行实施计划
- **supercraft-verification**: 完成前验证

## 目录结构

```
.supercraft/
├── config.yaml      # 项目配置
├── state.yaml       # 任务状态
├── history/         # 状态快照
├── specs/           # 用户规范
│   └── coding-style.md
└── templates/       # 文档模板
    ├── design-doc.md
    └── plan.md
```

## 配置层级

```
全局配置 (~/.supercraft/config.yaml)  ← 最低优先级
    ↓ 覆盖
项目配置 (.supercraft/config.yaml)
```

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run build

# 测试
npm test
```

## 许可证

MIT
