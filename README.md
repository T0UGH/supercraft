# Supercraft

可定制的 AI 辅助开发工作流系统，为 Claude Code 提供配置注入和进度管理能力。

## 测试 push

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

## 功能

- **配置管理**: 全局 + 项目级配置
- **状态持久化**: 任务状态跨会话保持
- **技能系统**: 4 个核心技能
  - `brainstorming`: 头脑风暴
  - `writing-plans`: 编写计划
  - `execute-plan`: 执行计划
  - `verification`: 完成前验证
- **规范注入**: 用户自定义规范注入 AI 上下文
- **模板管理**: 设计文档、计划模板

## 目录结构

```
.supercraft/
├── config.yaml      # 项目配置
├── state.yaml       # 任务状态
├── history/         # 状态快照
├── specs/           # 用户规范
└── templates/       # 文档模板
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
