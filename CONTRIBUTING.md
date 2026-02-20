# 贡献指南

感谢你对 Supercraft 感兴趣！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

1. 搜索 [Issues](https://github.com/T0UGH/supercraft/issues) 确保没有重复
2. 创建 Issue，包含：
   - 清晰的标题和描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息

### 提出新功能

1. 搜索现有 Issues 和 PR
2. 创建 Feature Request，说明：
   - 需求背景
   - 期望的实现方式
   - 可能的替代方案

### 提交代码

1. Fork 项目
2. 创建特性分支：
   ```bash
   git checkout -b feature/your-feature
   # 或
   git checkout -b fix/your-bug
   ```

3. 进行开发：
   ```bash
   npm install
   npm run dev    # 监听模式开发
   ```

4. 编写测试（如果有新功能）
   ```bash
   npm test
   ```

5. 提交更改：
   ```bash
   git add .
   git commit -m 'feat: add your feature'
   ```

6. 推送并创建 PR：
   ```bash
   git push origin feature/your-feature
   ```

## 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 新功能需要附带测试
- 更新相关文档

## Commit 消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: add new command
fix: resolve task rollback issue
docs: update README
style: format code
refactor: simplify config merge logic
test: add unit tests for state module
chore: update dependencies
```

## PR 审查流程

1. 自动检查（lint、test）
2. 维护者 Review
3. 合并或请求修改

---

有问题？欢迎在 GitHub 提问或加入讨论。
