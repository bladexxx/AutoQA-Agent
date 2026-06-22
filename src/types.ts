export interface TestStep {
  stepIndex: number;
  action: 'goto' | 'click' | 'type' | 'wait' | 'assert' | 'screenshot';
  selector?: string;
  value?: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  comment?: string;
}

export interface TestLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  targetUrl: string;
  category: 'smoke' | 'regression' | 'performance' | 'security' | 'custom';
  script: string; // Used for spec (Gherkin/Markdown)
  spec?: string;  // Explicit spec string
  actionIr?: string; // Serialized Action IR schema JSON
  createdAt: string;
}

export interface TestSession {
  id: string;
  testSuiteId: string;
  testSuiteName: string;
  targetUrl: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  failureReason?: string;
  workerNodeId: string;
  amqpCallbackStatus: 'idle' | 'published' | 'failed' | 'skipped';
  steps: TestStep[];
  logs: TestLog[];
  actionIr?: string; // Serialized Action IR schema executed
  analysis?: string; // Serialized Failure Analyticals JSON if failed
}

export interface WorkerNode {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'offline';
  containerId: string;
  cpuUsage: number;
  memoryUsage: number; // in MB
  concurrentTasks: number;
  maxTasks: number;
}

export interface QueueMetrics {
  amqpStatus: 'connected' | 'reconnecting' | 'disconnected' | 'simulating';
  clusterName: string;
  brokerIp: string;
  queueName: string;
  totalPublished: number;
  consumerCount: number;
  unacknowledgedMsgs: number;
}

export interface RabbitMqConfig {
  url: string;
  queueName: string;
  exchange: string;
  routingKey: string;
  enabled: boolean;
}
