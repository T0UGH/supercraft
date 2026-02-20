import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { calculateMetrics, generateTaskId, createTask, formatProgress, saveSnapshot } from '../../src/core/state.js';
import { Task, State } from '../../src/core/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'supercraft-state-test-' + Date.now());

// Mock filesystem functions
jest.unstable_mockModule('../../src/core/filesystem.js', () => ({
  getSupercraftDir: () => path.join(TEST_DIR, '.supercraft'),
  fileExists: (filePath: string) => {
    try {
      return fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  },
  ensureDir: (dir: string) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}));

const { getSupercraftDir } = await import('../../src/core/filesystem.js');

describe('state operations', () => {
  beforeEach(() => {
    // Clean up before each test
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
    const supercraftDir = getSupercraftDir();
    fs.mkdirSync(supercraftDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('saveSnapshot', () => {
    it('should save snapshot to history directory', () => {
      const state: State = {
        version: '1.0',
        project: { name: 'test', root: '/test' },
        current: {},
        tasks: [],
        metrics: {
          total_tasks: 0,
          completed: 0,
          in_progress: 0,
          pending: 0,
          blocked: 0,
          progress_percent: 0
        },
        metadata: {
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z'
        }
      };
      const snapshotPath = saveSnapshot(state);
      expect(snapshotPath).toContain('history');
      expect(fs.existsSync(snapshotPath)).toBe(true);
    });
  });
});

describe('calculateMetrics', () => {
  it('should calculate metrics for empty task list', () => {
    const metrics = calculateMetrics([]);
    expect(metrics.total_tasks).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.pending).toBe(0);
    expect(metrics.in_progress).toBe(0);
    expect(metrics.blocked).toBe(0);
    expect(metrics.progress_percent).toBe(0);
  });

  it('should calculate metrics correctly for mixed status', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'in_progress', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-3', title: 'Task 3', status: 'pending', priority: 'low', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-4', title: 'Task 4', status: 'blocked', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
    ];
    const metrics = calculateMetrics(tasks);
    expect(metrics.total_tasks).toBe(4);
    expect(metrics.completed).toBe(1);
    expect(metrics.in_progress).toBe(1);
    expect(metrics.pending).toBe(1);
    expect(metrics.blocked).toBe(1);
    expect(metrics.progress_percent).toBe(25);
  });

  it('should calculate 100% for all completed', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'completed', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
    ];
    const metrics = calculateMetrics(tasks);
    expect(metrics.progress_percent).toBe(100);
  });

  it('should round progress percent correctly', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'pending', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-3', title: 'Task 3', status: 'pending', priority: 'low', created_at: '2026-01-01T00:00:00Z' },
    ];
    const metrics = calculateMetrics(tasks);
    expect(metrics.progress_percent).toBe(33); // 1/3 = 33.33... rounded
  });
});

describe('generateTaskId', () => {
  it('should generate task-1 for empty list', () => {
    const id = generateTaskId([]);
    expect(id).toBe('task-1');
  });

  it('should generate task-3 for existing tasks', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-2', title: 'Task 2', status: 'pending', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
    ];
    const id = generateTaskId(tasks);
    expect(id).toBe('task-3');
  });

  it('should handle non-sequential IDs', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'task-5', title: 'Task 5', status: 'completed', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
    ];
    const id = generateTaskId(tasks);
    expect(id).toBe('task-6');
  });

  it('should handle tasks without task- prefix', () => {
    const tasks: Task[] = [
      { id: 'task-1', title: 'Task 1', status: 'completed', priority: 'high', created_at: '2026-01-01T00:00:00Z' },
      { id: 'abc', title: 'Task abc', status: 'pending', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
    ];
    const id = generateTaskId(tasks);
    expect(id).toBe('task-2');
  });
});

describe('createTask', () => {
  it('should create task with default values', () => {
    const task = createTask('Test Task', undefined, 'medium');
    expect(task.id).toBe('');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBeUndefined();
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.created_at).toBeDefined();
  });

  it('should create task with all parameters', () => {
    const task = createTask('Test Task', 'Description', 'high');
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Description');
    expect(task.priority).toBe('high');
  });

  it('should create task with low priority', () => {
    const task = createTask('Test Task', undefined, 'low');
    expect(task.priority).toBe('low');
  });
});

describe('formatProgress', () => {
  it('should format 0% progress', () => {
    const result = formatProgress(0);
    expect(result).toBe('░░░░░░░░░░');
  });

  it('should format 50% progress', () => {
    const result = formatProgress(50);
    expect(result).toBe('█████░░░░░');
  });

  it('should format 100% progress', () => {
    const result = formatProgress(100);
    expect(result).toBe('██████████');
  });

  it('should format 25% progress', () => {
    const result = formatProgress(25);
    expect(result).toBe('███░░░░░░░');
  });

  it('should round and handle edge cases', () => {
    expect(formatProgress(11)).toBe('██░░░░░░░░');
    expect(formatProgress(34)).toBe('████░░░░░░');
    expect(formatProgress(1)).toBe('█░░░░░░░░░');
  });
});
