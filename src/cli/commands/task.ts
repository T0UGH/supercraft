import { Command } from 'commander';
import { loadState, saveState, saveSnapshot, generateTaskId, createTask, calculateMetrics } from '../../core/state.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';
import { Task } from '../../core/types.js';

const taskCommand = new Command('task')
  .description('任务管理');

// task list 子命令
const listCommand = new Command('list')
  .description('列出所有任务')
  .option('-s, --status <status>', '按状态筛选')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    let tasks = state.tasks;

    // 按状态筛选
    if (options.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
      if (!validStatuses.includes(options.status)) {
        console.log(`✗ 无效的状态: ${options.status}`);
        console.log(`  有效状态: ${validStatuses.join(', ')}`);
        return;
      }
      tasks = tasks.filter(t => t.status === options.status);
    }

    if (options.json) {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    if (tasks.length === 0) {
      console.log('暂无任务');
      return;
    }

    console.log('\n任务列表:\n');
    for (const task of tasks) {
      const statusIcon = {
        completed: '✓',
        in_progress: '●',
        pending: '○',
        blocked: '✗'
      }[task.status];
      const priorityIcon = {
        high: '🔴',
        medium: '🟡',
        low: '🟢'
      }[task.priority];
      console.log(`  ${statusIcon} ${priorityIcon} ${task.id}: ${task.title}`);
      if (task.description) {
        console.log(`      ${task.description}`);
      }
    }
    console.log('');
  });

// task show 子命令
const showCommand = new Command('show')
  .description('显示任务详情')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    const statusLabel = {
      completed: '已完成',
      in_progress: '进行中',
      pending: '待处理',
      blocked: '已阻塞'
    }[task.status];

    console.log(`\n任务: ${task.id}`);
    console.log(`标题: ${task.title}`);
    console.log(`状态: ${statusLabel}`);
    console.log(`优先级: ${task.priority}`);
    if (task.description) {
      console.log(`描述: ${task.description}`);
    }
    console.log(`创建时间: ${task.created_at}`);
    if (task.started_at) {
      console.log(`开始时间: ${task.started_at}`);
    }
    if (task.completed_at) {
      console.log(`完成时间: ${task.completed_at}`);
    }
    if (task.blocked_reason) {
      console.log(`阻塞原因: ${task.blocked_reason}`);
    }
    console.log('');
  });

// task create 子命令
const createCommand = new Command('create')
  .description('创建新任务')
  .requiredOption('-t, --title <title>', '任务标题')
  .option('-d, --description <description>', '任务描述')
  .option('-p, --priority <priority>', '优先级 (high/medium/low)', 'medium')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const validPriorities = ['high', 'medium', 'low'];
    if (!validPriorities.includes(options.priority)) {
      console.log(`✗ 无效的优先级: ${options.priority}`);
      console.log(`  有效优先级: ${validPriorities.join(', ')}`);
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const newTask = createTask(
      options.title,
      options.description,
      options.priority
    );
    newTask.id = generateTaskId(state.tasks);

    state.tasks.push(newTask);
    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(newTask, null, 2));
      return;
    }

    console.log(`✓ 任务已创建: ${newTask.id}`);
    console.log(`  标题: ${newTask.title}`);
    console.log(`  优先级: ${newTask.priority}`);
  });

// task start 子命令
const startCommand = new Command('start')
  .description('开始执行任务')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已完成，无法再次开始`);
      return;
    }

    if (task.status === 'in_progress') {
      console.log(`✗ 任务已在进行中`);
      return;
    }

    // 创建快照（回退用）
    saveSnapshot(state);

    // 记住之前的状态
    const previousStatus = task.status;

    task.status = 'in_progress';
    task.started_at = new Date().toISOString();
    if (previousStatus === 'blocked') {
      task.blocked_reason = undefined;
    }

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已开始: ${task.id}`);
    console.log(`  标题: ${task.title}`);
  });

// task complete 子命令
const completeCommand = new Command('complete')
  .description('标记任务完成')
  .argument('<id>', '任务 ID')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已经完成`);
      return;
    }

    // 创建快照
    saveSnapshot(state);

    task.status = 'completed';
    task.completed_at = new Date().toISOString();

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已完成: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`\n进度: ${state.metrics.progress_percent}% (${state.metrics.completed}/${state.metrics.total_tasks})`);
  });

// task block 子命令
const blockCommand = new Command('block')
  .description('标记任务阻塞')
  .argument('<id>', '任务 ID')
  .argument('[reason]', '阻塞原因')
  .option('--json', 'JSON 格式输出')
  .action((id, reason, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    if (task.status === 'completed') {
      console.log(`✗ 任务已完成，无法阻塞`);
      return;
    }

    // 创建快照
    saveSnapshot(state);

    task.status = 'blocked';
    task.blocked_reason = reason || '未指定原因';

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✗ 任务已阻塞: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`  原因: ${task.blocked_reason}`);
  });

// task rollback 子命令
const rollbackCommand = new Command('rollback')
  .description('回退任务到上一状态')
  .argument('<id>', '任务 ID')
  .option('--to <status>', '回退到指定状态')
  .option('--json', 'JSON 格式输出')
  .action((id, options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      return;
    }

    const state = loadState();
    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.log(`✗ 任务不存在: ${id}`);
      return;
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    let targetStatus = options.to || getPreviousStatus(task.status);

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      console.log(`✗ 无法确定回退目标状态`);
      console.log(`  使用 --to 指定状态: ${validStatuses.join(', ')}`);
      return;
    }

    // 创建快照（回退前备份）
    saveSnapshot(state);

    task.status = targetStatus as Task['status'];
    if (targetStatus !== 'in_progress') {
      task.started_at = undefined;
    }
    if (targetStatus !== 'completed') {
      task.completed_at = undefined;
    }
    if (targetStatus !== 'blocked') {
      task.blocked_reason = undefined;
    }

    state.metrics = calculateMetrics(state.tasks);
    saveState(state);

    if (options.json) {
      console.log(JSON.stringify(task, null, 2));
      return;
    }

    console.log(`✓ 任务已回退: ${task.id}`);
    console.log(`  标题: ${task.title}`);
    console.log(`  新状态: ${targetStatus}`);
  });

function getPreviousStatus(currentStatus: string): string | null {
  const transitions: Record<string, string> = {
    'in_progress': 'pending',
    'completed': 'in_progress',
    'blocked': 'pending'
  };
  return transitions[currentStatus] || null;
}

taskCommand.addCommand(listCommand);
taskCommand.addCommand(showCommand);
taskCommand.addCommand(createCommand);
taskCommand.addCommand(startCommand);
taskCommand.addCommand(completeCommand);
taskCommand.addCommand(blockCommand);
taskCommand.addCommand(rollbackCommand);

export { taskCommand };
