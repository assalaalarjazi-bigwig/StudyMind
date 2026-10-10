import React, { useState } from 'react';
import {
  Sparkles,
  Maximize2,
  X,
  Layers,
  RotateCw,
  GitBranch,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { DiagramItem, DocumentItem } from '../types';

interface DiagramQAEntry {
  question: string;
  answer: string;
  timestamp: number;
}

interface DiagramsViewProps {
  document: DocumentItem;
  diagrams: DiagramItem[];
  isArabic: boolean;
  isDark?: boolean;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export const DiagramsView: React.FC<DiagramsViewProps> = ({
  document,
  diagrams,
  isArabic,
  isDark = false,
  isGenerating,
  onRegenerate,
}) => {
  const [modalDiagram, setModalDiagram] = useState<DiagramItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Interactive Inquiries & Q&A state per diagram
  const [inquiryExpandedId, setInquiryExpandedId] = useState<string | null>(null);
  const [inquiryInputs, setInquiryInputs] = useState<Record<string, string>>({});
  const [qaHistory, setQaHistory] = useState<Record<string, DiagramQAEntry[]>>({});
  const [loadingQA, setLoadingQA] = useState<Record<string, boolean>>({});

  // Global top inquiry state
  const [globalInquiryQuery, setGlobalInquiryQuery] = useState('');
  const [selectedGlobalDiagId, setSelectedGlobalDiagId] = useState<string>(diagrams[0]?.id || '');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalAnswer, setGlobalAnswer] = useState<string | null>(null);

  const filteredDiagrams = diagrams.filter((d) => {
    if (activeFilter === 'flowchart') return d.type.toLowerCase().includes('flow') || d.diagramType === 'flowchart';
    if (activeFilter === 'architecture') return d.type.toLowerCase().includes('arch') || d.diagramType === 'hierarchy';
    if (activeFilter === 'comparison') return d.type.toLowerCase().includes('comp') || d.diagramType === 'sawtooth';
    return true;
  });

  // Handle asking Gemini about a specific diagram
  const handleAskDiagram = async (diag: DiagramItem, customQuery?: string) => {
    const questionText = (customQuery || inquiryInputs[diag.id] || '').trim();
    if (!questionText) return;

    setLoadingQA((prev) => ({ ...prev, [diag.id]: true }));
    setInquiryExpandedId(diag.id);

    try {
      const res = await fetch('/api/diagram-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: questionText,
          diagram: diag,
          documentText: document.fullText || '',
          language: isArabic ? 'ar' : 'en',
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch explanation');
      const data = await res.json();

      setQaHistory((prev) => ({
        ...prev,
        [diag.id]: [
          ...(prev[diag.id] || []),
          {
            question: questionText,
            answer: data.reply || (isArabic ? 'تمت صياغة الشرح بنجاح.' : 'Explanation generated.'),
            timestamp: Date.now(),
          },
        ],
      }));

      // Clear input
      setInquiryInputs((prev) => ({ ...prev, [diag.id]: '' }));
    } catch (err) {
      console.error('Error asking about diagram:', err);
      setQaHistory((prev) => ({
        ...prev,
        [diag.id]: [
          ...(prev[diag.id] || []),
          {
            question: questionText,
            answer: isArabic
              ? 'حدث خطأ أثناء التواصل مع المعلم الذكي. يرجى إعادة المحاولة.'
              : 'Error connecting to the AI instructor. Please try again.',
            timestamp: Date.now(),
          },
        ],
      }));
    } finally {
      setLoadingQA((prev) => ({ ...prev, [diag.id]: false }));
    }
  };

  // Handle top global inquiry
  const handleGlobalInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = globalInquiryQuery.trim();
    if (!query) return;

    const targetDiag = diagrams.find((d) => d.id === selectedGlobalDiagId) || diagrams[0];
    setGlobalLoading(true);
    setGlobalAnswer(null);

    try {
      const res = await fetch('/api/diagram-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          diagram: targetDiag,
          documentText: document.fullText || '',
          language: isArabic ? 'ar' : 'en',
        }),
      });

      if (!res.ok) throw new Error('Global diagram inquiry failed');
      const data = await res.json();
      setGlobalAnswer(data.reply);
    } catch (err) {
      console.error(err);
      setGlobalAnswer(
        isArabic
          ? 'تعذر جلب التوضيح حالياً، يرجى المحاولة مرة أخرى.'
          : 'Could not fetch explanation right now. Please retry.'
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  // Quick suggestions for inquiries
  const quickPrompts = isArabic
    ? [
        'اشرح لي هذا المخطط بالتفصيل وخطواته',
        'ما الغرض الأساسي من هذا الشكل في المقرر؟',
        'أعطني مثالاً تطبيقياً واقعياً يوضح هذا المفهوم',
        'كيف يرد هذا الشكل في أسئلة الامتحانات؟',
      ]
    : [
        'Explain this diagram and its steps in detail',
        'What is the core purpose of this figure?',
        'Provide a concrete real-world applied example',
        'How does this concept appear on exam questions?',
      ];

  // Render clean, modern, responsive schematic representation (pure SVG + light/dark colors)
  const renderVisualCard = (diag: DiagramItem) => {
    const steps =
      diag.steps && diag.steps.length > 0
        ? diag.steps
        : isArabic
        ? ['مرحلة التهيئة والبدء', 'معالجة المدخلات والحزم', 'التحقق والضبط الحسابي', 'الاستقرار أو التعافي']
        : ['Initialization', 'Packet Processing', 'Verification & Adjustment', 'Recovery & Stability'];

    // 1. Sawtooth AIMD Chart
    if (diag.diagramType === 'sawtooth') {
      return (
        <div
          className={`rounded-xl p-4 border transition-colors ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3 font-semibold">
            <span className="flex items-center gap-1.5 text-blue-500">
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>{isArabic ? 'منحنى ديناميكية النافذة (AIMD Sawtooth)' : 'AIMD Sawtooth Dynamics'}</span>
            </span>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">
              {isArabic ? 'نمو خطي + هبوط نصفي' : 'Linear Growth + Multiplicative Halve'}
            </span>
          </div>

          <div className="flex items-end justify-between sm:justify-center h-28 gap-1.5 sm:gap-2.5 px-2 sm:px-4 pb-2 border-b border-slate-300 dark:border-slate-700">
            <div className="flex flex-col items-center gap-1">
              <div className="h-8 w-4 sm:w-5 bg-blue-500 rounded-t-sm" />
              <span className="text-[10px] text-slate-400">1</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-14 w-4 sm:w-5 bg-blue-500 rounded-t-sm" />
              <span className="text-[10px] text-slate-400">2</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-20 w-4 sm:w-5 bg-blue-500 rounded-t-sm" />
              <span className="text-[10px] text-slate-400">3</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-24 w-4 sm:w-5 bg-red-500 rounded-t-sm" title="Loss!" />
              <span className="text-[10px] text-red-500 font-bold">{isArabic ? 'فقدان' : 'Loss'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-12 w-4 sm:w-5 bg-amber-500 rounded-t-sm" title="Cut to 50%" />
              <span className="text-[10px] text-amber-500 font-bold">-50%</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-4 sm:w-5 bg-blue-500 rounded-t-sm" />
              <span className="text-[10px] text-slate-400">4</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-22 w-4 sm:w-5 bg-blue-500 rounded-t-sm" />
              <span className="text-[10px] text-slate-400">5</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-24 w-4 sm:w-5 bg-red-500 rounded-t-sm" />
              <span className="text-[10px] text-red-500 font-bold">{isArabic ? 'فقدان' : 'Loss'}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-12 w-4 sm:w-5 bg-amber-500 rounded-t-sm" />
              <span className="text-[10px] text-amber-500 font-bold">-50%</span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>{isArabic ? 'محور الزمن (دورات RTT)' : 'Time (RTT Cycles)'}</span>
            <span className="font-bold text-blue-500">{isArabic ? 'حجم نافذة cwnd' : 'cwnd (MSS)'}</span>
          </div>
        </div>
      );
    }

    // 2. Sliding Window Buffer
    if (diag.diagramType === 'slidingwindow') {
      return (
        <div
          className={`rounded-xl p-4 border transition-colors ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-3 font-semibold">
            <span className="flex items-center gap-1.5 text-cyan-500">
              <Activity className="w-4 h-4 shrink-0" />
              <span>{isArabic ? 'خارطة مخزن النافذة المنزلقة' : 'Sliding Window Buffer Map'}</span>
            </span>
            <span className="text-[11px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full font-bold">
              min(cwnd, rwnd)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-slate-300 dark:border-slate-800 text-center">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-[10px] text-emerald-500 font-bold block">{isArabic ? 'مؤكدة' : 'ACKed'}</span>
              <span className="text-xs font-mono font-bold">1..1000</span>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-[10px] text-blue-500 font-bold block">{isArabic ? 'قيد النقل' : 'In Flight'}</span>
              <span className="text-xs font-mono font-bold">1001..3000</span>
            </div>
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <span className="text-[10px] text-cyan-500 font-bold block">{isArabic ? 'متاحة' : 'Usable'}</span>
              <span className="text-xs font-mono font-bold">3001..4000</span>
            </div>
            <div className="p-2 bg-slate-400/10 border border-slate-400/20 rounded-lg opacity-60">
              <span className="text-[10px] text-slate-400 font-bold block">{isArabic ? 'مغلقة' : 'Blocked'}</span>
              <span className="text-xs font-mono font-bold">&gt;4000</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            {isArabic ? 'حركة النافذة تنزلق للأمام فور استلام إقرارات ACK' : 'Window advances forward as ACKs arrive'}
          </p>
        </div>
      );
    }

    // Default: Flowchart / Sequence / Hierarchy Stepper
    return (
      <div
        className={`rounded-xl p-4 border transition-colors ${
          isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-3 font-semibold">
          <span className="flex items-center gap-1.5 text-blue-500">
            <GitBranch className="w-4 h-4 shrink-0" />
            <span>{diag.type || (isArabic ? 'مسار منطقي' : 'Logical Flow')}</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {steps.length} {isArabic ? 'مراحل متسلسلة' : 'Sequential Steps'}
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-500 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div
                className={`flex-1 text-xs px-3 py-1.5 rounded-lg border font-medium truncate ${
                  isDark ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {st}
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 rtl:rotate-180 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 space-y-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg">
              📊 {isArabic ? 'المخططات والمفاهيم المرئية والاستفسار الذكي' : 'Visual Diagrams & Concept Explainer'}
            </span>
            <span className="text-xs bg-blue-500/10 text-blue-500 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
              {diagrams.length} {isArabic ? 'أشكال' : 'figures'}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isArabic
              ? 'تصفح المخططات المستخرجة من المستند، واسأل المعلم الذكي عن أي شكل ترغب في فهمه أو التوسع فيه.'
              : 'Explore extracted figures and interactively ask the AI instructor anything to deepen your understanding.'}
          </p>
        </div>

        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors shrink-0 ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isArabic ? 'تحديث المخططات' : 'Refresh Diagrams'}</span>
        </button>
      </div>

      {/* 2. Top Interactive Inquiry Bar (User can ask about ANY figure or concept) */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-all space-y-3 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 border-blue-900/40'
            : 'bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 border-blue-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
          <h3 className="text-sm font-bold">
            {isArabic ? 'استفسر أو اسأل الذكاء الاصطناعي عن أي شكل أو رسم بياني:' : 'Ask AI About Any Figure or Diagram:'}
          </h3>
        </div>

        <form onSubmit={handleGlobalInquirySubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedGlobalDiagId}
              onChange={(e) => setSelectedGlobalDiagId(e.target.value)}
              className={`text-xs font-semibold rounded-xl px-3 py-2 border transition-colors shrink-0 focus:outline-none ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {diagrams.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.figureNumber}: {d.title}
                </option>
              ))}
            </select>

            <div className="flex-1 relative">
              <input
                type="text"
                value={globalInquiryQuery}
                onChange={(e) => setGlobalInquiryQuery(e.target.value)}
                placeholder={
                  isArabic
                    ? 'مثال: اشرح لي كيف يعمل هذا المخطط ولماذا تهبط النافذة للنصف؟'
                    : 'e.g. Explain how this diagram operates and why the window halves?'
                }
                className={`w-full text-xs rounded-xl px-4 py-2.5 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={globalLoading || !globalInquiryQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              {globalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 rtl:rotate-180" />
              )}
              <span>{isArabic ? 'اسأل الآن' : 'Ask Now'}</span>
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">
              {isArabic ? 'أسئلة مقترحة سريعة:' : 'Quick Prompts:'}
            </span>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setGlobalInquiryQuery(prompt);
                  const targetDiag = diagrams.find((d) => d.id === selectedGlobalDiagId) || diagrams[0];
                  if (targetDiag) {
                    handleAskDiagram(targetDiag, prompt);
                  }
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-blue-900/30 hover:border-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>

        {/* Global Answer Display */}
        {globalAnswer && (
          <div
            className={`p-4 rounded-xl border mt-3 space-y-2 animate-in fade-in duration-200 ${
              isDark ? 'bg-blue-950/30 border-blue-800/60 text-blue-100' : 'bg-blue-50/80 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إجابة وشرح المعلم الذكي:' : 'AI Instructor Explanation:'}</span>
              </span>
              <button
                onClick={() => setGlobalAnswer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-line font-normal">{globalAnswer}</div>
          </div>
        )}
      </div>

      {/* 3. Filter Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isArabic ? `جميع المخططات (${diagrams.length})` : `All Figures (${diagrams.length})`}
        </button>
        <button
          onClick={() => setActiveFilter('flowchart')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            activeFilter === 'flowchart'
              ? 'bg-blue-600 text-white shadow-2xs'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isArabic ? 'مسارات العمل والخوارزميات' : 'Flowcharts'}
        </button>
        <button
          onClick={() => setActiveFilter('architecture')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            activeFilter === 'architecture'
              ? 'bg-blue-600 text-white shadow-2xs'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isArabic ? 'المعمارية والأنظمة' : 'Architectures'}
        </button>
        <button
          onClick={() => setActiveFilter('comparison')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 ${
            activeFilter === 'comparison'
              ? 'bg-blue-600 text-white shadow-2xs'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isArabic ? 'المقارنات والنماذج الحسابية' : 'Comparisons'}
        </button>
      </div>

      {/* 4. Diagrams Cards Grid with Integrated Interactive Q&A */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDiagrams.map((diag) => {
          const isExpanded = inquiryExpandedId === diag.id;
          const history = qaHistory[diag.id] || [];
          const isLoadingThis = Boolean(loadingQA[diag.id]);

          return (
            <div
              key={diag.id}
              className={`border rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-2xs flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700/80 hover:border-blue-500/50'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-blue-500 uppercase tracking-wider">
                    {diag.figureNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setModalDiagram(diag)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                      title={isArabic ? 'تكبير المخطط' : 'Maximize'}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-900'} leading-snug`}>
                    {diag.title}
                  </h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-relaxed`}>
                    {diag.description}
                  </p>
                </div>

                {/* Visual Schematic Card */}
                <div
                  className="cursor-pointer"
                  onClick={() => setModalDiagram(diag)}
                  title={isArabic ? 'انقر لتكبير المخطط' : 'Click to zoom'}
                >
                  {renderVisualCard(diag)}
                </div>

                {/* Core Concept Overview */}
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                    isDark ? 'bg-slate-800/70 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-blue-500">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'التحليل المفاهيمي السريع:' : 'Conceptual Overview:'}</span>
                  </div>
                  <p className="leading-relaxed opacity-95">{diag.aiAnalysis}</p>
                </div>
              </div>

              {/* 5. Interactive Q&A Accordion on Each Diagram */}
              <div className="border-t border-slate-200 dark:border-slate-700/80 pt-3 space-y-3">
                <button
                  onClick={() => setInquiryExpandedId(isExpanded ? null : diag.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isExpanded
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-blue-50/70 border-blue-200 text-blue-800 hover:bg-blue-100/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {isArabic
                        ? isExpanded
                          ? 'إخفاء مساحة الاستفسار'
                          : 'اسأل المعلم الذكي عن هذا الشكل وفهمه أكثر'
                        : isExpanded
                        ? 'Collapse Inquiry'
                        : 'Ask AI About This Figure'}
                    </span>
                    {history.length > 0 && (
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">
                        {history.length}
                      </span>
                    )}
                  </span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {/* Previous Q&A Thread for this diagram */}
                    {history.length > 0 && (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {history.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isDark
                                ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <p className="font-bold text-blue-500 flex items-center gap-1">
                              <span>❓ {item.question}</span>
                            </p>
                            <div className="leading-relaxed whitespace-pre-line text-xs font-normal">
                              {item.answer}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick suggestion prompt chips */}
                    <div className="flex flex-wrap gap-1">
                      {quickPrompts.slice(0, 2).map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAskDiagram(diag, p)}
                          disabled={isLoadingThis}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Inquiry Input Form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inquiryInputs[diag.id] || ''}
                        onChange={(e) =>
                          setInquiryInputs((prev) => ({ ...prev, [diag.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAskDiagram(diag);
                          }
                        }}
                        placeholder={
                          isArabic
                            ? 'اكتب سؤالك أو استفسارك عن هذا الشكل...'
                            : 'Type your question about this figure...'
                        }
                        className={`flex-1 text-xs rounded-xl px-3 py-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => handleAskDiagram(diag)}
                        disabled={isLoadingThis || !(inquiryInputs[diag.id] || '').trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center transition-colors shrink-0"
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Zoom Modal with Q&A Option */}
      {modalDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div
            className={`rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-blue-500 uppercase tracking-wider">
                  {modalDiagram.figureNumber}
                </span>
                <h3 className="font-bold text-lg mt-0.5">{modalDiagram.title}</h3>
              </div>
              <button
                onClick={() => setModalDiagram(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">{renderVisualCard(modalDiagram)}</div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {modalDiagram.description}
            </p>

            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isDark ? 'bg-blue-950/40 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <strong className="block font-bold text-blue-500 mb-1">
                💡 {isArabic ? 'التحليل المفاهيمي والشرح المعرفي:' : 'Detailed Conceptual Explanation:'}
              </strong>
              <p className="leading-relaxed">{modalDiagram.aiAnalysis}</p>
            </div>

            {/* Quick Action inside modal */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setInquiryExpandedId(modalDiagram.id);
                  setModalDiagram(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isArabic ? 'اسأل واستفسر عن هذا الشكل في الصفحة' : 'Open Inquiry Thread'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
