export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  blocked_reason?: string;
}

export interface Metrics {
  total_tasks: number;
  completed: number;
  in_progress: number;
  pending: number;
  blocked: number;
  progress_percent: number;
}

export interface State {
  version: string;
  project: {
    name: string;
    root: string;
  };
  current?: {
    plan_id?: string;
    plan_name?: string;
    phase?: string;
  };
  tasks: Task[];
  metrics: Metrics;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

export interface Config {
  project: {
    name: string;
  };
  verification?: {
    commands: string[];
  };
}
