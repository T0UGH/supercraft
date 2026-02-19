import { Command } from 'commander';
import { loadState, formatProgress } from '../../core/state.js';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

export const statusCommand = new Command('status')
  .description('查看当前项目状态和进度')
  .action(() => {
    const supercraftDir = getSupercraftDir();

    // 检查是否已初始化
    if (!fileExists(supercraftDir)) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const state = loadState();

    if (!state) {
      console.log('✗ 无法读取状态文件');
      return;
    }

    // 显示项目信息
    console.log(`\n项目: ${state.project.name}`);
    console.log(`根目录: ${state.project.root}`);

    // 显示当前计划
    if (state.current?.plan_name) {
      console.log(`\n当前计划: ${state.current.plan_name}`);
      console.log(`阶段: ${state.current.phase || '-'}`);
    }

    // 显示进度
    const { metrics } = state;
    console.log(`\n进度: ${formatProgress(metrics.progress_percent)} ${metrics.progress_percent}%`);
    console.log(`  总计: ${metrics.total_tasks} | 完成: ${metrics.completed} | 进行中: ${metrics.in_progress} | 待处理: ${metrics.pending} | 阻塞: ${metrics.blocked}`);

    // 显示任务列表
    if (state.tasks.length > 0) {
      console.log('\n任务:');
      for (const task of state.tasks) {
        const statusIcon = {
          completed: '✓',
          in_progress: '●',
          pending: '○',
          blocked: '✗'
        }[task.status];
        console.log(`  ${statusIcon} ${task.id}: ${task.title}`);
      }
    } else {
      console.log('\n暂无任务');
    }

    console.log(`\n最后更新: ${state.metadata.updated_at}\n`);
  });
