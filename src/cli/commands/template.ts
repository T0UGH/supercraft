import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileExists, getSupercraftDir } from '../../core/filesystem.js';

// 获取插件内置模板目录
function getBuiltinTemplatesDir(): string {
  // 使用 CLAUDE_PLUGIN_ROOT 环境变量（Claude Code 插件标准环境变量）
  // fallback 到当前目录（用于本地测试）
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || process.cwd();
  return path.join(pluginRoot, 'templates');
}

// 获取项目自定义模板目录
function getProjectTemplatesDir(): string {
  return path.join(getSupercraftDir(), 'templates');
}

// 列出所有模板（内置 + 项目）
function listAllTemplates(): { name: string; source: string; file: string }[] {
  const templates: { name: string; source: string; file: string }[] = [];

  // 项目模板
  const projectDir = getProjectTemplatesDir();
  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      templates.push({
        name: file.replace('.md', ''),
        source: 'project',
        file
      });
    }
  }

  // 内置模板
  const builtinDir = getBuiltinTemplatesDir();
  if (fs.existsSync(builtinDir)) {
    const files = fs.readdirSync(builtinDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const name = file.replace('.md', '');
      // 项目模板优先级更高
      if (!templates.find(t => t.name === name)) {
        templates.push({
          name,
          source: 'builtin',
          file
        });
      }
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

const templateCommand = new Command('template')
  .description('模板管理（模板类）');

// template list 子命令
const listCommand = new Command('list')
  .description('列出可用模板')
  .option('--json', 'JSON 格式输出')
  .action((options) => {
    const templates = listAllTemplates();

    if (templates.length === 0) {
      if (options.json) {
        console.log('[]');
      } else {
        console.log('暂无模板');
      }
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(templates, null, 2));
      return;
    }

    console.log('\n模板列表:\n');
    for (const t of templates) {
      const sourceLabel = t.source === 'project' ? '(项目)' : '(内置)';
      console.log(`  ${t.name} ${sourceLabel}`);
    }
    console.log('');
  });

// template show 子命令
const showCommand = new Command('show')
  .description('预览模板内容')
  .argument('<name>', '模板名称')
  .action((name) => {
    const templates = listAllTemplates();
    const template = templates.find(t => t.name === name);

    if (!template) {
      console.log(`✗ 模板不存在: ${name}`);
      console.log(`  运行 supercraft template list 查看可用模板`);
      return;
    }

    const dir = template.source === 'project'
      ? getProjectTemplatesDir()
      : getBuiltinTemplatesDir();
    const filePath = path.join(dir, template.file);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n# 模板: ${name} (${template.source})\n`);
    console.log(content);
  });

// template copy 子命令
const copyCommand = new Command('copy')
  .description('复制模板到本地（AI 调用）')
  .argument('<name>', '模板名称')
  .option('-o, --output <dir>', '输出目录', 'docs/plans')
  .option('-n, --filename <filename>', '自定义文件名')
  .action((name, options) => {
    const templates = listAllTemplates();
    const template = templates.find(t => t.name === name);

    if (!template) {
      console.log(`✗ 模板不存在: ${name}`);
      console.log(`  运行 supercraft template list 查看可用模板`);
      return;
    }

    // 获取模板内容
    const dir = template.source === 'project'
      ? getProjectTemplatesDir()
      : getBuiltinTemplatesDir();
    const templatePath = path.join(dir, template.file);
    let content = fs.readFileSync(templatePath, 'utf-8');

    // 替换占位符
    const today = new Date().toISOString().split('T')[0];
    content = content.replace(/{date}/g, today);
    content = content.replace(/{title}/g, '待填充');

    // 确定输出文件名
    const outputDir = options.output;
    let filename = options.filename;
    if (!filename) {
      filename = `${today}-${name}.md`;
    }

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      console.log(`✗ 文件已存在: ${outputPath}`);
      console.log(`  使用 --filename 指定不同的文件名`);
      return;
    }

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf-8');

    console.log(`✓ 模板已复制: ${outputPath}`);
    console.log('');
    console.log('请填充以下占位符:');
    console.log('  - {title}: 标题');
    console.log('  - [请描述...]: 描述性内容');
  });

templateCommand.addCommand(listCommand);
templateCommand.addCommand(showCommand);
templateCommand.addCommand(copyCommand);

export { templateCommand };
