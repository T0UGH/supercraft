import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { State, Task } from './types.js';
import { getSupercraftDir, fileExists } from './filesystem.js';

const STATE_FILE = 'state.yaml';

export function getStatePath(): string {
  return path.join(getSupercraftDir(), STATE_FILE);
}

export function loadState(): State | null {
  const statePath = getStatePath();
  if (!fileExists(statePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const state = yaml.parse(content) as State;
    // 基本验证
    if (!state || !state.tasks || !state.metrics) {
      console.error('状态文件格式无效');
      return null;
    }
    return state;
  } catch (e) {
    console.error('无法读取状态文件:', e);
    return null;
  }
}

export function saveState(state: State): void {
  state.metadata.updated_at = new Date().toISOString();
  const statePath = getStatePath();
  const content = yaml.stringify(state);
  fs.writeFileSync(statePath, content, 'utf-8');
}

export function saveSnapshot(state: State): string {
  const historyDir = path.join(getSupercraftDir(), 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}.yaml`;
  const snapshotPath = path.join(historyDir, filename);

  const content = yaml.stringify(state);
  fs.writeFileSync(snapshotPath, content, 'utf-8');

  return snapshotPath;
}

export function calculateMetrics(tasks: Task[]): State['metrics'] {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const in_progress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const total_tasks = tasks.length;
  const progress_percent = total_tasks > 0 ? Math.round((completed / total_tasks) * 100) : 0;

  return {
    total_tasks,
    completed,
    in_progress,
    pending,
    blocked,
    progress_percent
  };
}

export function formatProgress(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export function generateTaskId(tasks: Task[]): string {
  const existingIds = tasks.map(t => parseInt(t.id.replace('task-', ''))).filter(n => !isNaN(n));
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return `task-${maxId + 1}`;
}

export function createTask(title: string, description: string | undefined, priority: 'high' | 'medium' | 'low'): Task {
  return {
    id: '',
    title,
    description,
    status: 'pending',
    priority,
    created_at: new Date().toISOString()
  };
}
