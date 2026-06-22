import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Settings, 
  Terminal, 
  Sliders, 
  Database, 
  Cpu, 
  Layers, 
  Plus, 
  Trash, 
  Download, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  Activity, 
  Check, 
  ExternalLink,
  Code,
  Sparkles,
  Info,
  CheckSquare,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TestSuite, 
  TestSession, 
  WorkerNode, 
  QueueMetrics, 
  RabbitMqConfig,
  TestStep,
  TestLog
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'suites' | 'database' | 'rabbitmq' | 'docker' | 'guide'>('dashboard');
  
  // State variables
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [nodes, setNodes] = useState<WorkerNode[]>([]);
  const [queueInfo, setQueueInfo] = useState<{ config: RabbitMqConfig, metrics: QueueMetrics, logs: any[] }>({
    config: { url: '', queueName: '', exchange: '', routingKey: '', enabled: false },
    metrics: { amqpStatus: 'simulating', clusterName: '', brokerIp: '', queueName: '', totalPublished: 0, consumerCount: 0, unacknowledgedMsgs: 0 },
    logs: []
  });

  // Editor states
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [suiteName, setSuiteName] = useState('');
  const [suiteUrl, setSuiteUrl] = useState('');
  const [suiteDesc, setSuiteDesc] = useState('');
  const [suiteCategory, setSuiteCategory] = useState<'smoke' | 'regression' | 'performance' | 'security' | 'custom'>('smoke');
  const [suiteScript, setSuiteScript] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Custom AI LLM Provider Configuration states
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'litellm' | 'ollama'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiApiBase, setAiApiBase] = useState('');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash');
  const [showAiSettings, setShowAiSettings] = useState(false);



  // AI Suite Creator states
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean, errors: string[], warnings: string[] } | null>(null);
  const [isValidatingScript, setIsValidatingScript] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{ status: 'passed' | 'failed', failureReason?: string, steps: any[], logs: any[] } | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);

  // Connection validation states
  const [explorerUrl, setExplorerUrl] = useState('https://store.demo.org/cart');
  const [isExploring, setIsExploring] = useState(false);
  const [explorerResult, setExplorerResult] = useState<{ routes: any[], elements: any[], flows: any[] } | null>(null);

  const [testAmqpUrl, setTestAmqpUrl] = useState('amqp://admin:admin_secret@localhost:5672');
  const [testAmqpStatus, setTestAmqpStatus] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Live Running state
  const [runningSession, setRunningSession] = useState<TestSession | null>(null);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<TestSession | null>(null);
  const [isTriggeringTest, setIsTriggeringTest] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Poll intervals
  useEffect(() => {
    loadSuites();
    loadSessions();
    loadRabbitMq();
    loadDockerNodes();

    const interval = setInterval(() => {
      loadSessions();
      loadDockerNodes();
      loadRabbitMq();
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Scroll terminal logs on update
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runningSession?.logs, runningSession?.steps]);

  // Fetch functions
  const loadSuites = async () => {
    try {
      const res = await fetch('/api/suites');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuites(data);
        if (data.length > 0 && !selectedSuite) {
          selectSuiteForEditing(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load suites:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        // If there's an active running session background-simulating, sync it!
        const active = data.find(s => s.status === 'running');
        if (active) {
          setRunningSession(active);
        } else if (runningSession && runningSession.status === 'running') {
          // Sync completion
          const finished = data.find(s => s.id === runningSession.id);
          if (finished) {
            setRunningSession(finished);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadRabbitMq = async () => {
    try {
      const res = await fetch('/api/rabbitmq');
      const data = await res.json();
      if (data && data.config) {
        setQueueInfo(data);
      }
    } catch (err) {
      console.error('Failed to load RabbitMQ state:', err);
    }
  };

  const loadDockerNodes = async () => {
    try {
      const res = await fetch('/api/docker/nodes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNodes(data);
      }
    } catch (err) {
      console.error('Failed to load docker workers:', err);
    }
  };

  // Select Suite for Editor
  const selectSuiteForEditing = (suite: TestSuite) => {
    setSelectedSuite(suite);
    setSuiteName(suite.name);
    setSuiteUrl(suite.targetUrl);
    setSuiteDesc(suite.description);
    setSuiteCategory(suite.category);
    setSuiteScript(suite.script);
    setValidationResult(null);
    setDryRunResult(null);
  };

  const prepareNewSuite = () => {
    setSelectedSuite(null);
    setSuiteName('New Custom Test Suite');
    setSuiteUrl('https://');
    setSuiteDesc('Custom QA test using agent-browser selector rules.');
    setSuiteCategory('custom');
    setSuiteScript(`// New Custom QA Test Script\nimport { AgentBrowser } from 'agent-browser';\n\nconst agent = new AgentBrowser();\nawait agent.goto('https://');\nawait agent.assert('Page element exists');`);
    setValidationResult(null);
    setDryRunResult(null);
  };

  // CRUD Save
  const saveSuite = async () => {
    if (!suiteName || !suiteUrl || !suiteScript) return;
    setIsSaving(true);
    try {
      const payload = {
        name: suiteName,
        targetUrl: suiteUrl,
        description: suiteDesc,
        category: suiteCategory,
        script: suiteScript
      };

      let res;
      if (selectedSuite) {
        res = await fetch(`/api/suites/${selectedSuite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/suites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      await loadSuites();
      setIsSaving(false);
      setSelectedSuite(selectedSuite || data);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const deleteSuite = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this Test Suite? This deletes related SQLite items.')) return;
    try {
      await fetch(`/api/suites/${id}`, { method: 'DELETE' });
      await loadSuites();
      setSelectedSuite(null);
    } catch (err) {
      console.error(err);
    }
  };

  // AI Test Suite Helper Methods
  const generateWithAI = async () => {
    if (!suiteUrl || !suiteDesc) {
      alert('Please enter a Target URL and Description Notes first so the Gemini AI can generate the script contextually!');
      return;
    }
    setIsGeneratingScript(true);
    setValidationResult(null);
    setDryRunResult(null);
    try {
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suiteName,
          targetUrl: suiteUrl,
          description: suiteDesc,
          category: suiteCategory,
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            apiBase: aiApiBase,
            model: aiModel
          }
        })
      });
      const data = await response.json();
      if (data.script) {
        setSuiteScript(data.script);
      } else if (data.error) {
        alert('AI Script Generation failed: ' + data.error);
      }
    } catch (err: any) {
      console.error('AI generate error:', err);
      alert('Network failure generating script: ' + err.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const validateWithAI = async () => {
    if (!suiteScript) {
      alert('Please write active Gherkin Feature Specifications first.');
      return;
    }
    setIsValidatingScript(true);
    setValidationResult(null);
    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: suiteScript,
          targetUrl: suiteUrl,
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            apiBase: aiApiBase,
            model: aiModel
          }
        })
      });
      const data = await response.json();
      if (data.error) {
        setValidationResult({
          valid: false,
          errors: [data.error],
          warnings: []
        });
      } else {
        setValidationResult({
          valid: true,
          errors: [],
          warnings: [
            "Brain Planner Mode: Gherkin specified compiles perfectly to Playwright Action IR (Layer 3)!",
            JSON.stringify(data, null, 2)
          ]
        });
      }
    } catch (err: any) {
      console.error('Planner compiler compile error:', err);
      setValidationResult({
        valid: false,
        errors: [`Planner compilation error: ${err.message}`],
        warnings: []
      });
    } finally {
      setIsValidatingScript(false);
    }
  };

  const applyAdvisorPatch = async (sessionId: string, proposedPatch: any) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/apply-patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedPatch })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Healed & Patched!\nThe Gherkin specifications has been auto-healed in persistent SQlite repository!\nYou can now trigger this test again and it will PASS.');
        loadSuites();
        loadSessions();
        setRunningSession(null);
      } else {
        alert('Failed to apply: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const exploreTargetSite = async () => {
    if (!explorerUrl) {
      alert('Please specify a valid URL address.');
      return;
    }
    setIsExploring(true);
    setExplorerResult(null);
    try {
      const res = await fetch('/api/ai/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: explorerUrl,
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            apiBase: aiApiBase,
            model: aiModel
          }
        })
      });
      const data = await res.json();
      setExplorerResult(data);
    } catch (err: any) {
      alert('agent-browser Explorer failed: ' + err.message);
    } finally {
      setIsExploring(false);
    }
  };

  const dryRunSuite = async () => {
    if (!suiteUrl || !suiteScript) {
      alert('Please provide a Target URL and Script code to dry-run.');
      return;
    }
    setIsDryRunning(true);
    setDryRunResult(null);
    try {
      const response = await fetch('/api/ai/dry-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suiteName,
          targetUrl: suiteUrl,
          description: suiteDesc,
          category: suiteCategory,
          script: suiteScript,
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            apiBase: aiApiBase,
            model: aiModel
          }
        })
      });
      const data = await response.json();
      if (data.error) {
        alert('Dry-run simulation failed: ' + data.error);
      } else {
        setDryRunResult({
          status: data.status,
          failureReason: data.failureReason,
          steps: data.steps || [],
          logs: data.logs || []
        });
      }
    } catch (err: any) {
      console.error('Dry-run connection error:', err);
      alert('Dry Run simulated error: ' + err.message);
    } finally {
      setIsDryRunning(false);
    }
  };

  // Run Test Suite
  const executeSuite = async (suiteId: string) => {
    setIsTriggeringTest(true);
    setRunningSession(null);
    try {
      const res = await fetch('/api/sessions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: suiteId,
          aiConfig: {
            provider: aiProvider,
            apiKey: aiApiKey,
            apiBase: aiApiBase,
            model: aiModel
          }
        })
      });
      const data = await res.json();
      if (data && data.session) {
        setRunningSession(data.session);
        setActiveTab('dashboard'); // Switch immediately to terminal output view
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggeringTest(false);
    }
  };

  // Clear Sessions History
  const clearSessions = async () => {
    if (!confirm('Clear all SQLite test reports & runs database records? This is irreversible.')) return;
    try {
      await fetch('/api/sessions/clear', { method: 'POST' });
      setSessions([]);
      setRunningSession(null);
    } catch (err) {
      console.error(err);
    }
  };



  // RabbitMQ configuration update
  const saveRabbitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/rabbitmq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueInfo.config)
      });
      loadRabbitMq();
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic connection tester for the local cluster
  const testRabbitConnect = async () => {
    setTestingConnection(true);
    setTestAmqpStatus(null);
    try {
      const res = await fetch('/api/rabbitmq/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testAmqpUrl })
      });
      const data = await res.json();
      if (data.success) {
        setTestAmqpStatus({ success: true, message: data.message });
      } else {
        setTestAmqpStatus({ success: false, error: data.error || 'Server connection timed out.' });
      }
    } catch (err: any) {
      setTestAmqpStatus({ success: false, error: err.message || 'Unknown network error. Is port 5672 open?' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Render Status Badge helper
  const getStatusBadge = (status: 'passed' | 'failed' | 'running' | 'pending') => {
    switch (status) {
      case 'passed':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 uppercase">Passed</span>;
      case 'failed':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950/40 text-rose-300 border border-rose-900/60 uppercase animate-pulse">Failed</span>;
      case 'running':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-950/40 text-blue-400 border border-blue-900/60 uppercase animate-pulse">Running</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-medium font-mono bg-white/5 text-gray-400 border border-white/10 uppercase">Pending</span>;
    }
  };

  // Calculations for KPI dashboard
  const totalCompleted = sessions.filter(s => s.status !== 'running' && s.status !== 'pending').length;
  const passedCount = sessions.filter(s => s.status === 'passed').length;
  const successPercentage = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 100;
  
  const totalAvgMs = sessions.filter(s => s.status === 'passed' && s.durationMs).reduce((acc, curr) => acc + (curr.durationMs || 0), 0);
  const averageDuration = totalCompleted > 0 ? (totalAvgMs / totalCompleted).toFixed(0) : '480';

  // Average docker node CPU memory calculation
  const averageCpu = nodes.length > 0 ? Math.round(nodes.reduce((acc, curr) => acc + curr.cpuUsage, 0) / nodes.length) : 74;

  return (
    <div className="flex flex-col h-screen w-full bg-[#050506] text-gray-200 font-sans p-6 overflow-hidden select-none">
      
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] italic text-lg select-none">Q</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              AETHER QA <span className="text-blue-500 font-mono text-xs opacity-80 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded-sm">v4.0.2</span>
            </h1>
            <p className="text-[10px] text-gray-550 uppercase tracking-widest font-mono">Distributed Execution Framework</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">RabbitMQ Cluster</span>
            <span className={`text-xs font-mono font-medium ${queueInfo.config.enabled ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
              {queueInfo.config.enabled ? 'BOUND [ONLINE]' : 'DYNAMIC EMULATOR [ACTIVE]'}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-end border-l border-white/10 pl-6">
            <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Docker Runtime</span>
            <span className="text-xs text-blue-400 font-mono">{nodes.filter(n => n.status !== 'offline').length || 4} ACTIVE PODS</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#0e0e10] flex items-center justify-center text-xs text-blue-400 font-mono font-bold select-none cursor-pointer hover:border-blue-500/30 transition-all">
            QA
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex gap-6 py-6 overflow-hidden min-h-0">
        
        {/* LEFT NAV SIDEBAR */}
        <nav className="w-52 shrink-0 flex flex-col gap-1.5 justify-start">
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedSuite(suites[0] || null); }}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-400" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('suites')}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'suites'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Code className="w-4 h-4 text-purple-400" />
            Test Suites
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'database'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Database className="w-4 h-4 text-teal-400" />
            SQLite Analytics
          </button>

          <button
            onClick={() => setActiveTab('rabbitmq')}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'rabbitmq'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            Message Bus
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'docker'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Environment
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`w-full px-3 py-2.5 transition-all text-xs font-mono uppercase tracking-widest text-left flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-white/5 border-r-2 border-blue-500 text-white font-semibold'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/2'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            Docker Guide
          </button>

          {/* Global LLM Configuration Setup Drawer */}
          <div className="pt-2 border-t border-white/5 font-mono">
            <button
              onClick={() => setShowAiSettings(!showAiSettings)}
              className="w-full px-2.5 py-2 text-[10px] uppercase tracking-wider text-left flex items-center justify-between text-gray-400 hover:text-white transition-all bg-white/2 rounded hover:bg-white/5 border border-white/5"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                Global LLM Setup
              </span>
              <span className="text-[9px]">{showAiSettings ? '▲' : '▼'}</span>
            </button>

            {showAiSettings && (
              <div className="mt-2 p-2 bg-[#0e0e10]/95 border border-blue-500/15 rounded space-y-2 text-[10px]">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-gray-500 uppercase font-mono block">Custom API Base</label>
                  <input
                    type="text"
                    value={aiApiBase}
                    onChange={(e) => setAiApiBase(e.target.value)}
                    placeholder="e.g. http://localhost:11434/v1"
                    className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-gray-500 uppercase font-mono block">Authorization Secret</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="Defaults to ENV secret"
                    className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Resource Usage meter panel */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="p-3 bg-[#111113] rounded-lg border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-mono mb-2">Resource Usage</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${averageCpu}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-gray-450">
                <span>CPU TEMP load</span>
                <span>{averageCpu}%</span>
              </div>
            </div>
          </div>
        </nav>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
          
          {/* TAB 1: OVERVIEW & REAL-TIME STREAM */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
              
              {/* Dynamic KPI Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-[#0e0e10] border border-white/5 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Success Rate</p>
                  <h2 className={`text-2xl font-light tracking-tight ${successPercentage >= 80 ? 'text-white' : 'text-amber-400'}`}>
                    {successPercentage}<span className="text-sm text-gray-500 italic">%</span>
                  </h2>
                  <p className="text-[9px] text-emerald-500 font-mono mt-1">
                    {passedCount} / {totalCompleted || 1} passing suites
                  </p>
                </div>

                <div className="bg-[#0e0e10] border border-white/5 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Active Agents</p>
                  <h2 className="text-2xl font-light text-white font-mono">
                    {nodes.filter(n => n.status === 'busy').length || (runningSession ? 1 : 0)}
                  </h2>
                  <p className="text-[9px] text-blue-400 font-mono mt-1 italic">
                    {nodes.length || 3} containers connected
                  </p>
                </div>

                <div className="bg-[#0e0e10] border border-white/5 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Queue Depth</p>
                  <h2 className="text-2xl font-light font-mono text-orange-400">
                    {queueInfo.metrics.unacknowledgedMsgs || 0}
                  </h2>
                  <p className="text-[9px] text-gray-500 font-mono mt-1 uppercase">RabbitMQ async buffers</p>
                </div>

                <div className="bg-[#0e0e10] border border-white/5 p-4 rounded-xl shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Avg Latency</p>
                  <h2 className="text-2xl font-light text-white font-mono">
                    {averageDuration}<span className="text-sm text-gray-500">ms</span>
                  </h2>
                  <p className="text-[9px] text-gray-500 font-mono mt-1 uppercase">Execution loop</p>
                </div>
              </div>

              {/* Lower Section with live stream & topology split */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-0">
                
                {/* Center Main Live Stream and Simulator Component */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Virtual Chrome Headless Viewport frame */}
                  <div className="flex-1 bg-[#0e0e10] border border-white/5 rounded-2xl p-6 relative flex flex-col min-h-[380px] overflow-hidden">
                    
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <h3 className="text-xs font-semibold text-white tracking-widest flex items-center gap-2 uppercase font-mono">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
                        Live Browser Viewport
                      </h3>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-indigo-300 font-mono border border-white/10 uppercase">
                          {runningSession ? runningSession.workerNodeId : 'STANDBY'}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400 font-mono border border-white/10 uppercase">
                          Chromium Headless
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-400 flex items-center gap-2 mb-4 shrink-0">
                      <span className="text-emerald-400 select-none">GET</span>
                      <span className="truncate flex-1 text-gray-300">{runningSession ? runningSession.targetUrl : 'headless://agent-browser.isolated'}</span>
                      {runningSession ? getStatusBadge(runningSession.status) : <span className="text-[10px] text-gray-500 font-mono uppercase">IDLE</span>}
                    </div>

                    {/* Simulation stage view */}
                    <div className="flex-1 min-h-[160px] bg-black/60 border border-white/5 rounded-xl flex flex-col overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        {!runningSession ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                          >
                            <Terminal className="w-10 h-10 text-gray-600 mb-2 animate-pulse" />
                            <h4 className="text-gray-300 text-xs uppercase tracking-wider font-semibold font-mono">No Active Automated Process</h4>
                            <p className="text-[11px] text-gray-550 max-w-sm mt-1">
                              Select a suite from the topology list on the right and click "Run Agent" to occupy a Docker isolated container.
                            </p>
                          </motion.div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col p-4 overflow-y-auto"
                          >
                            {(() => {
                              let parsedAnalysis: any = null;
                              if (runningSession && runningSession.analysis) {
                                try {
                                  parsedAnalysis = typeof runningSession.analysis === 'string'
                                    ? JSON.parse(runningSession.analysis)
                                    : runningSession.analysis;
                                } catch (err) {
                                  console.error('Failed to parse session analysis block:', err);
                                }
                              }
                              return (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                    
                                    {/* Sequence details list */}
                                    <div className="space-y-2 overflow-y-auto pr-1">
                                      <span className="text-[9px] text-gray-500 font-mono uppercase block tracking-wider">Step Action Sequence</span>
                                      <div className="space-y-1.5">
                                        {runningSession.steps.map((step, idx) => (
                                          <div 
                                            key={idx}
                                            className={`p-2 rounded border text-[11px] font-mono flex items-center justify-between transition-all ${
                                              step.status === 'running' 
                                                ? 'bg-blue-950/20 border-blue-500 text-blue-300' 
                                                : step.status === 'passed'
                                                ? 'bg-emerald-950/10 border-emerald-950/40 text-emerald-400'
                                                : 'bg-rose-950/10 border-rose-950/40 text-rose-400'
                                            }`}
                                          >
                                            <div className="truncate flex items-center gap-1.5">
                                              <span className="text-gray-500">{step.stepIndex}.</span>
                                              <span className="uppercase font-semibold">{step.action}</span>
                                              {step.selector && <span className="text-gray-400">({step.selector})</span>}
                                              {step.value && <span className="text-gray-300">"{step.value}"</span>}
                                            </div>
                                            <span className="text-xs">
                                              {step.status === 'running' && '●'}
                                              {step.status === 'passed' && '✓'}
                                              {step.status === 'failed' && '✗'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Target GUI Render box */}
                                    <div className="bg-black/80 rounded-lg p-4 border border-white/5 flex flex-col items-center justify-center text-center relative">
                                      <span className="absolute top-2 left-2 text-[8px] font-mono text-gray-500 tracking-wider">BROWSER VIEWPORT</span>
                                      
                                      {runningSession.status === 'running' ? (
                                        <div className="space-y-2">
                                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
                                          <span className="text-[10px] text-gray-400 font-mono block">Simulating micro actions...</span>
                                        </div>
                                      ) : runningSession.status === 'passed' ? (
                                        <div className="space-y-1.5 text-center">
                                          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                                          <p className="text-xs font-semibold text-white uppercase font-mono tracking-wide">Flow Evaluated</p>
                                          <p className="text-[9px] text-gray-400 font-mono">Assertion complete. Callback dispatched to RabbitMQ broker.</p>
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 text-center">
                                          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                                          <p className="text-xs font-semibold text-rose-400 uppercase font-mono tracking-wide">Test Exception</p>
                                          <p className="text-[9px] text-gray-400 font-mono line-clamp-2">{runningSession.failureReason || 'Selector rule mismatched target node.'}</p>
                                        </div>
                                      )}
                                    </div>

                                  </div>

                                  {/* Dynamic advisor segment */}
                                  {parsedAnalysis && (
                                    <div className="mt-4 bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 space-y-3 text-left animate-fade-in shrink-0">
                                      <div className="flex items-center gap-2 text-rose-450 border-b border-rose-500/10 pb-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                                        <span className="text-xs uppercase tracking-wider font-semibold font-mono">Self-Healing Failure Advisor (Section 8)</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                        <div className="space-y-1 bg-black/40 p-3 rounded border border-white/5">
                                          <span className="text-[10px] text-gray-500 uppercase block">AI Root Cause Analysis</span>
                                          <p className="text-gray-300 leading-normal text-[11px]">{parsedAnalysis.rootCause || 'Mismatched button descriptor on target SPA form.'}</p>
                                        </div>
                                        <div className="space-y-1 bg-black/40 p-3 rounded border border-white/5">
                                          <span className="text-[10px] text-gray-500 uppercase block">Suggested Playwright Locator Selector</span>
                                          <code className="text-emerald-400 block text-[11px] bg-emerald-950/25 p-1 rounded border border-emerald-900/20 select-all font-semibold mt-1">
                                            {parsedAnalysis.suggestedLocator || "page.getByRole('button', { name: 'Apply Coupon' })"}
                                          </code>
                                        </div>
                                      </div>

                                      {parsedAnalysis.patchProposal && (
                                        <div className="bg-black p-3.5 rounded-lg border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
                                          <div className="space-y-1 flex-1">
                                            <span className="text-[9px] text-purple-400 font-semibold uppercase tracking-wider block">Patch proposed by AI (Dynamic Healing)</span>
                                            <div className="text-[11px] text-gray-300 space-y-0.5 mt-1">
                                              <div>Target Keyword: <code className="text-rose-400 font-bold bg-rose-950/30 px-1 rounded">{parsedAnalysis.patchProposal.targetSelector || 'Apply Coupon button'}</code></div>
                                              <div>Replacement Selector: <code className="text-emerald-400 font-bold bg-emerald-950/30 px-1 rounded">{parsedAnalysis.patchProposal.replacementSelector || "page.getByRole('button', { name: 'Use Coupon' })"}</code></div>
                                              <div className="text-[10px] text-gray-400 mt-1 italic">Proposed Gherkin substitution: "{parsedAnalysis.patchProposal.newGherkinLine}"</div>
                                            </div>
                                          </div>
                                          
                                          <button
                                            onClick={() => applyAdvisorPatch(runningSession.id, parsedAnalysis.patchProposal)}
                                            className="bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono text-[10px] px-4 py-2 rounded uppercase font-bold tracking-wider inline-flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] shrink-0 self-end md:self-center"
                                          >
                                            <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                                            Apply Patch proposed by AI
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Integrated dynamic scroll telemetry logs trail */}
                    <div className="h-36 bg-black border border-white/5 rounded-xl p-3 shrink-0 flex flex-col overflow-hidden font-mono mt-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-1.5 text-[9px] text-gray-550 shrink-0 uppercase tracking-widest font-mono">
                        <span>Terminal stderr/stdout logs (Telemetry sync)</span>
                        <span>{runningSession?.logs.length || 0} buffered</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-1 select-text scrollbar-thin text-[10px]">
                        {runningSession?.logs.map((log, index) => (
                          <div key={index} className="flex gap-2 text-[10px] font-mono leading-tight">
                            <span className="text-gray-650 shrink-0">{log.timestamp?.slice(11, 19) || ''}</span>
                            <span className={`px-1 rounded text-[8px] font-bold shrink-0 uppercase ${
                              log.level === 'error' ? 'bg-rose-950/60 text-rose-405' :
                              log.level === 'success' ? 'bg-emerald-950/60 text-emerald-405' :
                              'bg-white/5 text-gray-400'
                            }`}>{log.level}</span>
                            <span className={log.level === 'error' ? 'text-rose-450' : log.level === 'success' ? 'text-emerald-400' : 'text-gray-300'}>
                              {log.message}
                            </span>
                          </div>
                        ))}

                        {!runningSession && (
                          <div className="text-center text-gray-600 text-[10px] pt-8 italic uppercase tracking-wider font-mono">
                            Wait for docker container activation to log network frames.
                          </div>
                        )}
                        <div ref={terminalEndRef} />
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Side Column - Topology list and analytics */}
                <aside className="w-full flex flex-col gap-6">
                  
                  {/* System Topology list view */}
                  <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 shadow-sm space-y-3 shrink-0">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Test Suites List</h4>
                    
                    <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                      {suites.map((suite) => (
                        <div 
                          key={suite.id}
                          className="bg-white/2 border border-white/5 hover:border-blue-500/30 p-2.5 rounded flex items-center justify-between gap-1 transition-all"
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 rounded-sm">
                                {suite.category}
                              </span>
                              <h5 className="text-xs font-semibold text-white truncate max-w-[120px]">{suite.name}</h5>
                            </div>
                            <p className="text-[9px] text-gray-500 font-mono truncate mt-0.5">{suite.targetUrl}</p>
                          </div>

                          <button 
                            onClick={() => executeSuite(suite.id)}
                            disabled={isTriggeringTest || (runningSession && runningSession.status === 'running')}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-mono text-[10px] px-2.5 py-1 rounded-sm tracking-wider uppercase font-semibold transition-all inline-flex items-center gap-1 shrink-0"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            Run
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Topology & Analysis Breakdown */}
                  <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 flex-1 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-mono">Core System Topology</h4>
                      
                      <div className="flex flex-col gap-2 font-mono text-[11px] text-gray-300">
                        <div className="flex justify-between border-b border-white/5 py-1.5">
                          <span className="text-gray-550">SQLite Schema Rows</span>
                          <span className="text-white font-bold">{sessions.length + suites.length} recorded</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 py-1.5">
                          <span className="text-gray-550">RabbitMQ Status</span>
                          <span className={queueInfo.config.enabled ? 'text-emerald-400' : 'text-amber-400'}>
                            {queueInfo.config.enabled ? 'DIRECT' : 'EMULATOR'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 py-1.5">
                          <span className="text-gray-550">Active Worker Threads</span>
                          <span className="text-blue-400 font-bold">{nodes.length || 3} containers</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-gray-500 uppercase font-mono">Concurrency workload balance</span>
                        <span className="text-[10px] font-mono text-blue-400">Balanced</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 mt-1">
                        <div className="h-3.5 bg-blue-500/20 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/30 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/40 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/50 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/60 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/70 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/80 rounded-sm"></div>
                        <div className="h-3.5 bg-blue-500/95 rounded-sm"></div>
                        <div className="h-3.5 bg-white/10 rounded-sm"></div>
                        <div className="h-3.5 bg-white/10 rounded-sm"></div>
                        <div className="h-3.5 bg-white/10 rounded-sm"></div>
                        <div className="h-3.5 bg-white/10 rounded-sm"></div>
                      </div>
                    </div>

                  </div>

                </aside>

              </div>

            </div>
          )}

          {/* TAB 2: TEST SUITES EDITOR */}
          {activeTab === 'suites' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
              
              {/* Suites list drawer */}
              <div className="lg:col-span-1 bg-[#0e0e10] border border-white/5 rounded-xl p-5 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-white font-mono">Suite Repository</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Write new automation scripts</p>
                  </div>
                  <button 
                    onClick={prepareNewSuite}
                    className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 font-mono text-[9px] px-2 py-1 rounded uppercase font-bold"
                  >
                    + NEW
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {suites.map((suite) => (
                    <div
                      key={suite.id}
                      onClick={() => selectSuiteForEditing(suite)}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        selectedSuite?.id === suite.id 
                          ? 'bg-white/5 border-blue-500 text-white' 
                          : 'bg-white/2 border-white/5 hover:bg-white/4 text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 py-0.5 rounded">
                          {suite.category}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">SQLite ID: {suite.id}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{suite.name}</h4>
                      <p className="text-[9px] text-gray-500 font-mono truncate mt-1">{suite.targetUrl}</p>
                    </div>
                  ))}
                </div>

                {/* agent-browser Explorer Mode Panel */}
                <div className="border-t border-white/5 pt-4 mt-4 shrink-0 flex flex-col min-h-[220px]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span className="text-[10px] text-gray-300 font-mono uppercase tracking-wider font-semibold">agent-browser Site Explorer</span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-mono mb-2">
                    Automatically inspect pages using LLMs CDP tunnel. Discover accessible tags, sitemaps & forms of any URL.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={explorerUrl}
                      onChange={(e) => setExplorerUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-black border border-white/5 text-[10px] font-mono text-white rounded px-2.5 py-1 focus:outline-none"
                    />
                    <button
                      onClick={exploreTargetSite}
                      disabled={isExploring}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-mono text-[9px] px-2.5 py-1 rounded uppercase font-semibold transition-all inline-flex items-center gap-1 shrink-0"
                    >
                      {isExploring ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Explore'}
                    </button>
                  </div>

                  {explorerResult ? (
                    <div className="mt-3 bg-black/50 border border-white/5 rounded p-2.5 space-y-2 text-[9.5px] font-mono overflow-y-auto max-h-44 scrollbar-thin">
                      <div className="space-y-1">
                        <span className="text-purple-400 font-semibold block border-b border-white/5 pb-0.5">Discovered Routes (Sitemap):</span>
                        {explorerResult.routes?.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-gray-400">
                            <span>Route: {r.path}</span>
                            <span className="text-[8px] bg-white/5 text-gray-400 px-1 py-0.2 rounded font-sans uppercase font-bold">{r.type}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-emerald-450 font-semibold block border-b border-white/5 pb-0.5">Accessibility Nodes (A11y Map):</span>
                        {explorerResult.elements?.map((el: any, idx: number) => (
                          <div key={idx} className="text-gray-400">
                            <span className="text-gray-500 font-sans">[{el.role}]</span> {el.name} <code className="text-[8px] text-emerald-400 font-semibold bg-white/2 px-0.5 rounded">{el.selector}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex-1 border border-dashed border-white/5 rounded min-h-[90px] flex items-center justify-center text-[10px] text-gray-650 font-mono select-none">
                      {isExploring ? 'Tunnelling CDP connection...' : 'CDP Engine Standby'}
                    </div>
                  )}
                </div>

              </div>

              {/* Code Script Compiler panel */}
              <div className="lg:col-span-2 bg-[#0e0e10] border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between">
                
                <div className="bg-white/2 px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0 font-mono">
                  <span className="text-xs text-blue-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    Interactive JavaScript/TypeScript Compiler
                  </span>
                  
                  {selectedSuite && (
                    <button 
                      onClick={() => deleteSuite(selectedSuite.id)}
                      className="text-gray-500 hover:text-rose-400 transition-colors"
                      title="Deconstruct suite"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  {/* AI LLM Model Configurator Selector */}
                  <div className="bg-gradient-to-r from-blue-950/15 via-purple-950/10 to-neutral-950/15 border border-white/5 rounded-lg p-3.5 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                       <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                       <span className="text-[10px] text-gray-300 font-mono uppercase tracking-wider font-semibold">Active LLM Execution Config</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-mono block uppercase">Model Provider</label>
                        <select
                          value={aiProvider}
                          onChange={(e: any) => {
                            const prov = e.target.value;
                            setAiProvider(prov);
                            if (prov === 'gemini') setAiModel('gemini-3.5-flash');
                            else if (prov === 'openai') setAiModel('gpt-4o');
                            else if (prov === 'ollama') setAiModel('gemma4');
                            else if (prov === 'litellm') setAiModel('gpt-4o');
                          }}
                          className="w-full bg-black border border-white/5 focus:border-blue-500/50 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                        >
                          <option value="gemini">Google Gemini (Default)</option>
                          <option value="openai">OpenAI (Direct API)</option>
                          <option value="ollama">Ollama (Local / Self-hosted)</option>
                          <option value="litellm">LiteLLM Proxy Router</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 font-mono block uppercase">Target Model</label>
                        <input
                          type="text"
                          value={aiModel}
                          onChange={(e) => setAiModel(e.target.value)}
                          placeholder="e.g. gemini-3.5-flash / gpt-4o"
                          className="w-full bg-black border border-white/5 focus:border-blue-500/50 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inputs metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-mono block uppercase">Suite Name</label>
                      <input 
                        type="text" 
                        value={suiteName}
                        onChange={(e) => setSuiteName(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-blue-500/50 rounded px-3 py-1.5 text-xs font-semibold text-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-mono block uppercase">Target URL Address</label>
                      <input 
                        type="text" 
                        value={suiteUrl}
                        onChange={(e) => setSuiteUrl(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-blue-500/50 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-mono block uppercase">Automation Category</label>
                      <select
                        value={suiteCategory}
                        onChange={(e: any) => setSuiteCategory(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-blue-500 border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                      >
                        <option value="smoke">Smoke (冒烟测试)</option>
                        <option value="regression">Regression (回归测试)</option>
                        <option value="performance">Performance (性能审计)</option>
                        <option value="security">Security (安全漏洞测试)</option>
                        <option value="custom">Custom (自定义脚本)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-mono block uppercase">Description Notes</label>
                      <input 
                        type="text" 
                        value={suiteDesc}
                        onChange={(e) => setSuiteDesc(e.target.value)}
                        className="w-full bg-black border border-white/5 focus:border-blue-500/55 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* script script editor text */}
                  <div className="space-y-1 flex-1 flex flex-col min-h-[160px]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-gray-500 font-mono block uppercase">Gherkin Feature Specification Document (Brain Planner Layer 2)</label>
                      <span className="text-[9px] text-gray-500 font-mono uppercase bg-purple-950/20 text-purple-400 border border-purple-900/40 px-1 py-0.5 rounded">Gherkin Domain DSL</span>
                    </div>
                    <div className="flex-1 bg-black rounded border border-white/5 overflow-hidden flex flex-col">
                      <textarea
                        value={suiteScript}
                        onChange={(e) => setSuiteScript(e.target.value)}
                        placeholder={`Feature: Checkout Flow\n  Scenario: promo discount\n    Given user opens "https://store.demo.org/cart"\n    When user clicks the "Add to Cart" button`}
                        className="flex-1 bg-black text-purple-300 p-4 font-mono text-[11px] focus:outline-none resize-none leading-relaxed min-h-[220px]"
                        style={{ tabSize: 2 }}
                      />
                    </div>
                  </div>

                  {/* AI Assistant Toolkit Section */}
                  <div className="bg-[#141416]/90 border border-purple-500/15 hover:border-purple-500/30 rounded-lg p-4 space-y-3 transition-colors mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Gemini AI Test Suite Builder</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={generateWithAI}
                          disabled={isGeneratingScript || isDryRunning}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-mono text-[10px] px-2.5 py-1 rounded transition-all flex items-center gap-1 uppercase font-bold disabled:opacity-50"
                        >
                          {isGeneratingScript ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Draft Gherkin Spec
                        </button>
                        
                        <button
                          type="button"
                          onClick={validateWithAI}
                          disabled={isValidatingScript || isDryRunning || !suiteScript}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] px-2.5 py-1 rounded transition-all flex items-center gap-1 uppercase font-bold disabled:opacity-50"
                        >
                          {isValidatingScript ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Compile Spec
                        </button>

                        <button
                          type="button"
                          onClick={dryRunSuite}
                          disabled={isDryRunning || !suiteScript}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] px-2.5 py-1 rounded transition-all flex items-center gap-1 uppercase font-bold disabled:opacity-50"
                        >
                          {isDryRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Dry-Run (Simulate)
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 leading-normal font-mono">
                      💡 Write a beautiful Gherkin feature spec list inside the workspace above. Click <strong className="text-emerald-400">Compile Spec</strong> to compile it into Action IR JSON arrays, or select <strong className="text-rose-455">Dry-Run</strong> to simulate interaction frames.
                    </p>

                    {/* AI Validation results */}
                    {validationResult && (
                      <div className={`p-3 rounded text-[10.5px] font-mono border ${
                        validationResult.valid 
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-950/25 border-rose-500/25 text-rose-350'
                      }`}>
                        <div className="font-bold uppercase text-[10px] flex items-center gap-1 mb-1">
                          {validationResult.valid ? '✅ Suite Quality Check Passed' : '⚠️ Code Warning Flags Detected'}
                        </div>
                        {validationResult.errors.length > 0 && (
                          <div className="space-y-1 my-1">
                            {validationResult.errors.map((e, idx) => (
                              <div key={idx} className="flex gap-1 items-start text-[10px] text-rose-400 bg-red-950/10 p-1 rounded border border-red-900/10">
                                <span>❌</span> <span className="flex-1">{e}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {validationResult.warnings.length > 0 && (
                          <div className="space-y-1">
                            {validationResult.warnings.map((w, idx) => (
                              <div key={idx} className="flex gap-1 items-start text-[10px] text-amber-300/90 bg-amber-955/10 p-1 rounded border border-amber-900/10">
                                <span>⚠️</span> <span className="flex-1">{w}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Dry Run output */}
                    {dryRunResult && (
                      <div className="bg-[#0b0b0c] rounded border border-white/5 overflow-hidden">
                        <div className="bg-white/2 px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-purple-300 uppercase font-semibold">⚡ AI Dry-Run Live Interaction log stream</span>
                          <span className={`px-1.5 rounded uppercase font-bold text-[8px] ${
                            dryRunResult.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {dryRunResult.status === 'passed' ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        
                        <div className="p-3 text-[10px] font-mono space-y-2 max-h-48 overflow-y-auto">
                          {dryRunResult.failureReason && (
                            <div className="bg-red-950/40 border border-red-900/30 text-rose-400 p-2 rounded mb-1 text-[10px]">
                              <strong>Error details:</strong> {dryRunResult.failureReason}
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-gray-500 block uppercase text-[8.5px] tracking-wider mb-1 font-semibold">Simulated DOM Navigation steps:</span>
                            {dryRunResult.steps.map((st: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 py-0.5 border-b border-white/2">
                                <span className="text-gray-650 shrink-0 select-none">#{st.stepIndex}</span>
                                <span className={`px-1 p-0.5 rounded text-[8px] uppercase font-bold shrink-0 font-sans ${
                                  st.status === 'passed' ? 'bg-emerald-950/60 text-emerald-450' : 'bg-rose-950/60 text-rose-400'
                                }`}>
                                  {st.action}
                                </span>
                                <code className="text-emerald-400 shrink-0 text-[10px]">{st.selector || ''}</code>
                                <span className="text-gray-300 truncate text-[10px]">{st.value ? `"${st.value}"` : ''}</span>
                                <span className="text-xs text-gray-500 select-none">-</span>
                                <span className="text-gray-400 select-all italic text-[10px] truncate">{st.comment || ''}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 space-y-1">
                            <span className="text-gray-500 block uppercase text-[8.5px] tracking-wider mb-1 font-semibold">Trace outputs (agent-browser logs):</span>
                            <div className="bg-[#050505] p-2.5 rounded border border-white/5 space-y-1 font-mono text-[9px] text-emerald-400">
                              {dryRunResult.logs.map((log: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                  <span className="text-gray-600 shrink-0">{log.timestamp?.slice(11, 19) || ''}</span>
                                  <span className={`px-1 rounded text-[7.5px] font-bold shrink-0 uppercase ${
                                    log.level === 'error' ? 'bg-rose-950/60 text-rose-450' :
                                    log.level === 'success' ? 'bg-emerald-950/60 text-emerald-450' :
                                    log.level === 'warn' ? 'bg-amber-950/60 text-amber-450' :
                                    'bg-gray-800 text-gray-300'
                                  }`}>
                                    {log.level}
                                  </span>
                                  <span className="text-gray-300 select-text">{log.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* compiler editor bottom tray */}
                <div className="bg-white/2 px-5 py-3 border-t border-white/5 flex items-center justify-between shrink-0 text-xs font-mono">
                  <span className="text-[10px] text-gray-550">
                    * Saved records compile immediately into SQLite database memory layer.
                  </span>
                  
                  <button
                    onClick={saveSuite}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-500 font-mono text-get font-semibold tracking-wider text-xs px-4 py-1.5 rounded uppercase text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] disabled:opacity-50 transition-all ml-4 shrink-0 flex items-center gap-1"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Save to SQLite
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: SQLITE ANALYTICS BROWSER */}
          {activeTab === 'database' && (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
              
              {/* Header database toolbar */}
              <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-white font-mono flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-400" />
                    SQLite relational database table browser
                  </h3>
                  <p className="text-[10px] text-gray-550 font-mono mt-0.5">
                    Binary storage active: <span className="bg-black text-[9px] px-1.5 py-0.5 text-blue-400 border border-white/5 font-bold uppercase rounded ml-1">/app/qa_database.sqlite</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={loadSessions}
                    className="bg-[#121214] border border-white/5 hover:bg-white/2 text-gray-300 font-mono text-[10px] px-3 py-1.5 rounded uppercase tracking-wider transition-all inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reload
                  </button>
                  <button 
                    onClick={clearSessions}
                    className="bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/30 text-rose-300 font-mono text-[10px] px-3 py-1.5 rounded uppercase tracking-wider transition-all inline-flex items-center gap-1"
                  >
                    <Trash className="w-3 h-3" />
                    Wipe Reports
                  </button>
                </div>
              </div>

              {/* Grid table representation */}
              <div className="flex-1 bg-[#0e0e10] border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-0">
                <div className="bg-white/2 p-3 font-mono text-[10px] text-gray-500 border-b border-white/5 flex justify-between shrink-0">
                  <span>SQLite schema: test_sessions (latest 50 trace recordings)</span>
                  <span>Row actions enabled</span>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/40 text-gray-500 font-mono uppercase text-[9px] tracking-wider border-b border-white/5">
                        <th className="p-3">Session Hash</th>
                        <th className="p-3">Suite Name</th>
                        <th className="p-3">Target Address</th>
                        <th className="p-3">Evaluation Status</th>
                        <th className="p-3">Run duration</th>
                        <th className="p-3">AMQP Dispatched</th>
                        <th className="p-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px] text-gray-300">
                      {sessions.map((sess) => (
                        <tr 
                          key={sess.id}
                          onClick={() => setSelectedSessionForDetails(sess)}
                          className="hover:bg-white/2 cursor-pointer transition-colors"
                        >
                          <td className="p-3 font-bold text-blue-400 text-[10.5px] truncate max-w-[120px]">{sess.id}</td>
                          <td className="p-3 text-white font-sans font-medium">{sess.testSuiteName}</td>
                          <td className="p-3 text-[10px] text-gray-500 truncate max-w-[180px]">{sess.targetUrl}</td>
                          <td className="p-3">{getStatusBadge(sess.status)}</td>
                          <td className="p-3 text-blue-400 font-bold">{sess.durationMs || 480} ms</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              sess.amqpCallbackStatus === 'published' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                              sess.amqpCallbackStatus === 'failed' ? 'bg-rose-950/40 text-rose-300 border border-rose-900/30' :
                              'bg-white/5 text-gray-400'
                            }`}>
                              {sess.amqpCallbackStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right text-gray-500 text-[10px]">{sess.startedAt?.slice(11, 19) || ''}</td>
                        </tr>
                      ))}

                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-550 italic uppercase font-mono tracking-wider">
                            No telemetry logs found in SQLite storage file. Trigger browser agents to generate recordings.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table details popup drawers */}
              <AnimatePresence>
                {selectedSessionForDetails && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#0e0e10] border border-blue-500/20 rounded-xl p-6 shadow-xl space-y-4 shrink-0 font-mono"
                  >
                    <div className="flex items-start justify-between border-b border-white/5 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                            SQL Record Inspector
                          </span>
                          <h4 className="text-white text-xs font-semibold">{selectedSessionForDetails.testSuiteName}</h4>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">DB Row Primary UUID: {selectedSessionForDetails.id}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedSessionForDetails(null)}
                        className="text-gray-400 hover:text-white font-mono text-[9px] px-2 py-1 rounded bg-black border border-white/10 uppercase"
                      >
                        [Wipe Overlay]
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
                      <div className="space-y-2">
                        <h5 className="text-[9px] uppercase font-mono text-gray-500">De-serialized Actions Timeline Block (BLOB)</h5>
                        <div className="bg-black/60 p-3 rounded border border-white/5 space-y-2 max-h-48 overflow-y-auto font-mono text-[11px] text-gray-300">
                          {selectedSessionForDetails.steps.map((step, idx) => (
                            <div key={idx} className="border-b border-white/5 pb-2 last:border-0">
                              <span className="text-gray-500">{step.stepIndex}.</span>{' '}
                              <span className="text-blue-400 font-bold uppercase">{step.action}</span>
                              {step.selector && <span className="text-purple-400 ml-1">[{step.selector}]</span>}
                              <div className="text-[10px] text-gray-500 mt-0.5 italic">{step.comment || 'Node asserted successfully.'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[9px] uppercase font-mono text-gray-500 font-bold">Standard stream console logs (Buffered)</h5>
                        <div className="bg-black/60 p-3 rounded border border-white/5 space-y-1 max-h-48 overflow-y-auto text-[10.5px] text-emerald-400 font-mono">
                          {selectedSessionForDetails.logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-gray-600 select-none">{log.timestamp?.slice(14, 19) || ''}</span>
                              <span className={log.level === 'error' ? 'text-rose-450 font-bold' : 'text-gray-300'}>{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* TAB 4: MESSAGE BUS MONITOR */}
          {activeTab === 'rabbitmq' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
              
              {/* Message bus configurations Column */}
              <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-1 text-xs">
                
                {/* bind form inputs config */}
                <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest font-semibold text-white font-mono">AMQP Connection bus</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Configure custom RabbitMQ exchange endpoints.
                    </p>
                  </div>

                  <form onSubmit={saveRabbitConfig} className="space-y-3 font-mono text-[11px]">
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-bold">Broker URL</label>
                      <input 
                        type="text"
                        value={queueInfo.config.url}
                        onChange={(e) => setQueueInfo({
                          ...queueInfo,
                          config: { ...queueInfo.config, url: e.target.value }
                        })}
                        className="w-full bg-black border border-white/5 rounded px-2.5 py-1.5 text-white text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-bold">Exchange Label</label>
                      <input 
                        type="text"
                        value={queueInfo.config.exchange}
                        onChange={(e) => setQueueInfo({
                          ...queueInfo,
                          config: { ...queueInfo.config, exchange: e.target.value }
                        })}
                        className="w-full bg-black border border-white/5 rounded px-2.5 py-1.5 text-white text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-bold">Routing Key binding</label>
                      <input 
                        type="text"
                        value={queueInfo.config.routingKey}
                        onChange={(e) => setQueueInfo({
                          ...queueInfo,
                          config: { ...queueInfo.config, routingKey: e.target.value }
                        })}
                        className="w-full bg-black border border-white/5 rounded px-2.5 py-1.5 text-white text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 block uppercase font-bold">Queue Target identifier</label>
                      <input 
                        type="text"
                        value={queueInfo.config.queueName}
                        onChange={(e) => setQueueInfo({
                          ...queueInfo,
                          config: { ...queueInfo.config, queueName: e.target.value }
                        })}
                        className="w-full bg-black border border-white/5 rounded px-2.5 py-1.5 text-white text-xs font-mono"
                      />
                    </div>

                    {/* switch container toggle */}
                    <div className="bg-white/2 border border-white/5 p-3 rounded flex items-center justify-between mt-4">
                      <div>
                        <span className="text-xs font-semibold text-white block">Interactive AMQP Dispatch</span>
                        <span className="text-[9px] text-gray-500">Publish states to nodes</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={queueInfo.config.enabled} 
                          onChange={(e) => setQueueInfo({
                            ...queueInfo,
                            config: { ...queueInfo.config, enabled: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs py-2 rounded-sm uppercase tracking-widest font-bold transition-all mt-4"
                    >
                      Update AMQP bindings
                    </button>
                  </form>
                </div>

                {/* connection tester checker tool */}
                <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest font-semibold text-white font-mono font-bold">AMQP connectivity tester</h4>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">Send a quick ping to confirm cluster isolation variables.</p>
                  </div>

                  <div className="space-y-3">
                    <input 
                      type="text" 
                      value={testAmqpUrl}
                      onChange={(e) => setTestAmqpUrl(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-gray-700"
                      placeholder="amqp://user:password@host:port"
                    />

                    <button 
                      onClick={testRabbitConnect}
                      disabled={testingConnection}
                      className="w-full bg-[#121214] border border-white/5 hover:bg-white/2 text-blue-400 font-mono text-xs py-2 rounded uppercase font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
                      Dispatch ping heartbeat
                    </button>

                    {testAmqpStatus && (
                      <div className={`p-3 rounded border text-[10.5px] font-mono leading-relaxed ${
                        testAmqpStatus.success 
                          ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-450' 
                          : 'bg-rose-950/20 border-rose-900/60 text-rose-450'
                      }`}>
                        <div className="font-bold uppercase text-[9px] flex items-center gap-1 mb-1 font-mono">
                          {testAmqpStatus.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {testAmqpStatus.success ? 'AMQP Socket Online' : 'Gateway socket dropped'}
                        </div>
                        <p>{testAmqpStatus.message || testAmqpStatus.error}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Live stream details column right */}
              <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden min-h-0">
                
                {/* metrics boxes */}
                <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 space-y-4 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-blue-400">
                    Real-time queue parameters
                  </span>
                  <h3 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
                    ACTIVE QUEUE: <span className="text-blue-400 underline">{queueInfo.metrics.queueName || 'qa_execution_callback'}</span>
                  </h3>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/50 p-4 rounded border border-white/5 text-center font-mono">
                      <span className="text-[9px] text-gray-550 block uppercase">Published Packets</span>
                      <span className="text-xl font-light text-white leading-tight block tracking-tight mt-1">
                        {queueInfo.metrics.totalPublished || sessions.length}
                      </span>
                    </div>

                    <div className="bg-black/50 p-4 rounded border border-white/5 text-center font-mono">
                      <span className="text-[9px] text-gray-550 block uppercase">Consumer Threads</span>
                      <span className="text-xl font-light text-emerald-400 leading-tight block tracking-tight mt-1">
                        {queueInfo.metrics.consumerCount || 3}
                      </span>
                    </div>

                    <div className="bg-black/50 p-4 rounded border border-white/5 text-center font-mono">
                      <span className="text-[9px] text-gray-550 block uppercase">Unacknowledged</span>
                      <span className="text-xl font-light text-orange-400 leading-tight block tracking-tight mt-1">
                        {queueInfo.metrics.unacknowledgedMsgs || 0}
                      </span>
                    </div>

                    <div className="bg-black/40 p-4 rounded border border-white/5 text-center flex items-center justify-center font-mono">
                      <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                        ● CLUSTER LIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* interactive exchange log list */}
                <div className="flex-1 bg-[#0e0e10] border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-0">
                  <div className="bg-white/2 p-3 font-mono text-[10px] text-gray-550 border-b border-white/5 flex justify-between shrink-0">
                    <span>RabbitMQ Event Stream Monitor logs</span>
                    <span>Broker Port: 5672</span>
                  </div>

                  <div className="flex-1 bg-black/80 p-4 overflow-y-auto space-y-1.5 font-mono text-[11px] leading-relaxed select-text pr-1">
                    {queueInfo.logs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-gray-655 shrink-0">{log.timestamp?.slice(11, 19) || ''}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${
                          log.event === 'PUBLISH' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/40' :
                          log.event === 'CONNECT_FAIL' ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40' :
                          'bg-white/5 text-gray-400'
                        }`}>{log.event}</span>
                        <span className="text-gray-300">{log.text}</span>
                      </div>
                    ))}

                    {queueInfo.logs.length === 0 && (
                      <div className="text-center text-gray-600 italic uppercase tracking-wider text-[10px] pt-12">
                        No AMQP socket frames broadcasted yet. Keep system running.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: ENVIRONMENT WORKERS PANEL */}
          {activeTab === 'docker' && (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden min-h-0">
              
              <div className="bg-[#0e0e10] border border-white/5 rounded-xl p-5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-white font-mono flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-indigo-400 font-bold" />
                    Docker Sandbox Container Instances Control
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    Individual chromium nodes isolated dynamically inside separate sandboxed containers
                  </p>
                </div>
                
                <button 
                  onClick={loadDockerNodes}
                  className="bg-[#121214] border border-white/5 hover:bg-white/2 text-gray-300 font-mono text-[10px] px-3 py-1.5 rounded uppercase tracking-wider transition-all inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Synchronize
                </button>
              </div>

              {/* Bento Grid layout */}
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {nodes.map((node) => (
                    <div 
                      key={node.id} 
                      className={`bg-[#0e0e10] border rounded-xl overflow-hidden shadow-sm flex flex-col transition-all ${
                        node.status === 'busy' ? 'border-blue-500/30' : 'border-white/5'
                      }`}
                    >
                      <div className="bg-white/2 p-4 border-b border-white/5 flex items-center justify-between shrink-0 font-mono">
                        <div>
                          <h4 className="text-xs font-semibold text-white">{node.name}</h4>
                          <span className="text-[9px] text-gray-550 font-mono">CONTAINER HASH: {node.containerId}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          node.status === 'busy' ? 'bg-blue-950 text-blue-400 border border-blue-900/40' :
                          node.status === 'idle' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' :
                          'bg-white/5 text-gray-400 border border-white/10'
                        }`}>
                          {node.status}
                        </span>
                      </div>

                      <div className="p-4 flex-1 space-y-4 font-mono text-[11px] text-gray-300">
                        {/* CPU Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10.5px] font-semibold text-gray-450">
                            <span>COMPUTE TEMP (CPU)</span>
                            <span className="text-blue-400 font-bold">{node.cpuUsage}%</span>
                          </div>
                          <div className="w-full bg-black rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${node.cpuUsage}%` }} />
                          </div>
                        </div>

                        {/* Memory Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10.5px] font-semibold text-gray-450">
                            <span>MEMORY LOAD (RAM)</span>
                            <span className="text-blue-400 font-bold">{node.memoryUsage} MB</span>
                          </div>
                          <div className="w-full bg-black rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${(node.memoryUsage / 512) * 100}%` }} />
                          </div>
                        </div>

                        <div className="bg-black/50 p-2.5 rounded border border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">Concurrency Slots</span>
                          <span className="text-white font-semibold">
                            {node.concurrentTasks} / {node.maxTasks} slots reserved
                          </span>
                        </div>
                      </div>

                    </div>
                  ))}

                  {nodes.length === 0 && (
                    <div className="md:col-span-3 text-center py-12 text-gray-600 italic uppercase font-mono tracking-wider text-xs">
                      No automated sandbox instances detected in the dynamic registry.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: CLUSTER DOCKER MANIFEST FILES */}
          {activeTab === 'guide' && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
              
              {/* manual instructions column left */}
              <div className="lg:col-span-1 bg-[#0e0e10] border border-white/5 rounded-xl p-5 flex flex-col justify-start gap-4 overflow-y-auto">
                <div className="flex items-center gap-2 text-blue-400 shrink-0 font-mono">
                  <Server className="w-5 h-5" />
                  <h3 className="text-white font-semibold text-xs uppercase tracking-widest">Docker Deployment Setup</h3>
                </div>
                
                <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                  Leverage our custom Docker & Compose configuration cluster scripts to spin up high frequency Selenium/Chromium worker sandboxes.
                </p>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Bridge internal Node APIs with Docker Compose to deploy background RabbitMQ listener loops on targeted cloud resources.
                </p>

                <div className="space-y-3.5 border-t border-white/5 pt-4 text-[11px] font-mono">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 font-bold">1</span>
                    <p className="text-gray-300">
                      Copy or export files into target machine workspace.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 font-bold">2</span>
                    <p className="text-gray-300">
                      Declare correct credentials inside local <code className="bg-black text-rose-300 px-1 rounded">.env</code> configurations.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0 font-bold">3</span>
                    <div className="text-gray-300">
                      Spawn containers instantly: <br/> 
                      <code className="bg-black block px-2 py-1 text-[10px] text-emerald-400 mt-1 uppercase border border-white/5 rounded">docker-compose up -d --build</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manifest representation code panels */}
              <div className="lg:col-span-2 bg-[#0e0e10] border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between">
                <div className="bg-white/2 p-3 border-b border-white/5 text-xs text-gray-400 font-mono">
                  <span>YAML Cluster and file structure profiles</span>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-mono block uppercase">Compose volume mount: docker-compose.yml</span>
                    <pre className="bg-black/80 p-4 rounded border border-white/5 text-[10px] text-blue-405 font-mono overflow-auto leading-relaxed max-h-56">
{`# Docker Compose cluster orchestration
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    volumes:
      - ./sqlite-data:/app/data
    depends_on:
      - rabbitmq-master1`}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-mono block uppercase">Headless Chrome stack: Dockerfile</span>
                    <pre className="bg-black/80 p-4 rounded border border-white/5 text-[10px] text-emerald-450 font-mono overflow-auto leading-relaxed max-h-56">
{`# Isolated Chrome sandboxed container
FROM node:20-slim
RUN apt-get update && apt-get install -y \\
    chromium \\
    sqlite3
WORKDIR /app
COPY . .
RUN npm ci --production
CMD ["npm", "start"]`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white/2 p-3 border-t border-white/5 text-[10.5px] text-gray-500 font-mono shrink-0">
                  <span>* Keep host port 5672 (RabbitMQ) bound.</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-auto flex justify-between items-center py-4 border-t border-white/10 shrink-0">
        <div className="flex gap-4">
          <span className="text-[10px] text-gray-500 uppercase font-mono">Node ID: <span className="text-gray-300">Production-Alpha-01</span></span>
          <span className="text-[10px] text-gray-500 uppercase font-mono">Engine: <span className="text-gray-300 italic">Vercel-Labs Agent</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest italic font-mono select-none">SYSTEMS OPERATIONAL</span>
        </div>
      </footer>

    </div>
  );
}
