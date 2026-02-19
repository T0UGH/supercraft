#!/bin/bash
# SessionStart hook for supercraft plugin
# 读取项目配置和状态，注入 AI 上下文

set -euo pipefail

# 确定插件根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 获取当前项目目录
PROJECT_ROOT="${PWD}"
SUPERCRAFT_DIR="${PROJECT_ROOT}/.supercraft"

# 转义 JSON 字符串
escape_for_json() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# 检查是否已初始化
if [ -d "$SUPERCRAFT_DIR" ]; then
  # 读取配置文件
  CONFIG_CONTENT=""
  if [ -f "${SUPERCRAFT_DIR}/config.yaml" ]; then
    CONFIG_CONTENT=$(cat "${SUPERCRAFT_DIR}/config.yaml" 2>/dev/null || echo "")
  fi

  # 读取状态文件
  STATE_CONTENT=""
  if [ -f "${SUPERCRAFT_DIR}/state.yaml" ]; then
    STATE_CONTENT=$(cat "${SUPERCRAFT_DIR}/state.yaml" 2>/dev/null || echo "")
  fi

  # 转义内容
  CONFIG_ESCAPED=$(escape_for_json "$CONFIG_CONTENT")
  STATE_ESCAPED=$(escape_for_json "$STATE_CONTENT")

  # 输出 JSON 格式的上下文注入
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<SUPERCRRAFT_CONTEXT>\n当前项目配置:\n${CONFIG_ESCAPED}\n\n当前进度:\n${STATE_ESCAPED}\n</SUPERCRRAFT_CONTEXT>"
  }
}
EOF
fi

exit 0
