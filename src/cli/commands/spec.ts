import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

const specCommand = new Command('spec')
  .description('规范管理（知识类）');

// spec list 子命令
const listCommand = new Command('list')
  .description('列出所有规范')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const specsDir = path.join(getSupercraftDir(), 'specs');
    if (!fs.existsSync(specsDir)) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无规范');
      }
      return;
    }

    const files = fs.readdirSync(specsDir)
      .filter(f => f.endsWith('.md'));

    if (files.length === 0) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无规范');
      }
      return;
    }

    if (options.json) {
      const specs = files.map(f => ({
        name: f.replace('.md', ''),
        file: f,
        path: path.join(specsDir, f)
      }));
      console.log(JSON.stringify(specs, null, 2));
      return;
    }

    console.log('\n规范列表:\n');
    for (const file of files) {
      const name = file.replace('.md', '');
      const filePath = path.join(specsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ${name}`);
      console.log(`    文件: ${file}`);
      console.log(`    更新: ${stats.mtime.toISOString().split('T')[0]}`);
    }
    console.log('');
  });

// spec get 子命令
const getCommand = new Command('get')
  .description('获取规范内容（注入 AI 上下文）')
  .argument('<name>', '规范名称')
  .action((name) => {
    if (!fileExists(getSupercraftDir())) {
      console.log('✗ 项目未初始化');
      console.log('  请先运行: supercraft init');
      return;
    }

    const specsDir = path.join(getSupercraftDir(), 'specs');
    const specFile = path.join(specsDir, `${name}.md`);

    if (!fs.existsSync(specFile)) {
      console.log(`✗ 规范不存在: ${name}`);
      console.log(`  运行 supercraft spec list 查看可用规范`);
      return;
    }

    const content = fs.readFileSync(specFile, 'utf-8');

    // 输出规范内容（用于注入 AI 上下文）
    console.log(`\n<SPEC name="${name}">\n`);
    console.log(content);
    console.log(`\n</SPEC>\n`);
  });

specCommand.addCommand(listCommand);
specCommand.addCommand(getCommand);

export { specCommand };
