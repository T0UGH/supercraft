# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Supercraft is a Claude Code plugin that provides customizable AI-assisted development workflow capabilities, including configuration injection, progress management, and skill extensions.

## Common Commands

```bash
# Build the TypeScript project
npm run build

# Run tests with coverage
npm test

# Run tests in watch mode (development)
npm run dev
```

## Architecture

The project is organized as a Claude Code plugin with CLI commands:

```
src/
├── cli/
│   ├── index.ts          # CLI entry point using commander.js
│   └── commands/         # Command implementations
│       ├── init.ts       # Initialize project
│       ├── status.ts     # Show project status
│       ├── task.ts       # Task management (list, create, start, complete, block, rollback)
│       ├── state.ts      # State management (snapshot, history, restore)
│       ├── config.ts     # Config management (list, get, set)
│       ├── spec.ts       # Specification management
│       └── template.ts   # Template management
└── core/
    ├── types.ts          # TypeScript type definitions
    ├── config.ts         # Config loading/saving (global + project)
    ├── state.ts          # State management (tasks, metrics, snapshots)
    └── filesystem.ts     # File system utilities
```

## Data Storage

- **Global config**: `~/.supercraft/config.yaml`
- **Project config**: `.supercraft/config.yaml`
- **State**: `.supercraft/state.yaml`
- **History**: `.supercraft/history/`
- **Specs**: `.supercraft/specs/`
- **Templates**: `.supercraft/templates/`

## Skills

Four skills are available in `skills/` directory:
- `supercraft-brainstorming` - Brainstorming workflow
- `supercraft-writing-plans` - Plan writing workflow
- `supercraft-execute-plan` - Plan execution workflow
- `supercraft-verification` - Verification workflow

## Key Patterns

- Configuration merges global and project configs (project takes precedence)
- Task status flows: `pending → in_progress → completed` (or `blocked`)
- Snapshots are saved as timestamped YAML files in `history/`
- All file operations use the utilities in `src/core/filesystem.ts`
