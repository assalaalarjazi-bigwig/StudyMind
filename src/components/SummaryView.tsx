import React, { useState } from 'react';
import { FileText, RefreshCw, Copy, Check, Download, BookOpen } from 'lucide-react';
import { DocumentItem } from '../types';

interface SummaryViewProps {
  document: DocumentItem;
  summary: string;
  isArabic: boolean;
  isDark?: boolean;
  isGenerating: boolean;
  summaryMode: string;
  onModeChange: (mode: string) => void;
  onGenerate: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  document,
  summary,
  isArabic,
  isDark = false,
  isGenerating,
  summaryMode,
  onModeChange,
  onGenerate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border p-4 sm:p-6 space-y-6 transition-colors`}>
      {/* Header and Controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {isArabic ? 'الملخصات الأكاديمية الشاملة' : 'In-Depth Academic Summaries'}
            </h3>
            <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
              {document.pageCount} {isArabic ? 'صفحة' : 'pages'}
            </span>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
            {isArabic
              ? `ملخص عميق مستخلص مباشرة من نصوص ملفك "${document.filename}"`
              : `Comprehensive summary extracted directly from "${document.filename}"`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className={`flex items-center gap-1.5 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'} border rounded-xl px-2.5 py-1.5 text-xs`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isArabic ? 'النمط:' : 'Mode:'}</span>
            <select
              value={summaryMode}
              onChange={(e) => onModeChange(e.target.value)}
              className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'} bg-transparent focus:outline-none cursor-pointer`}
            >
              <option value="comprehensive">{isArabic ? 'تحليل شامل ومفصل لكل الفصول' : 'Comprehensive Chapter-by-Chapter'}</option>
              <option value="executive">{isArabic ? 'ملخص تنفيذي وخلاصات مركزة' : 'Executive Overview'}</option>
              <option value="concepts">{isArabic ? 'فهرس المفاهيم والنظريات' : 'Concept & Theory Index'}</option>
              <option value="formulas">{isArabic ? 'المعادلات والقواعد المنطقية' : 'Formulas & Rules'}</option>
              <option value="exam_cram">{isArabic ? 'مذكرة مراجعة ليلة الامتحان' : 'Exam Cram Review'}</option>
            </select>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? (isArabic ? 'جارٍ التلخيص...' : 'Generating...') : isArabic ? 'توليد ملخص عميق' : 'Generate Summary'}</span>
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 border ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
            } font-semibold px-3 py-2 rounded-xl text-xs transition-colors`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : isArabic ? 'نسخ' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Structured Content Area */}
      <div className={`border rounded-2xl p-6 ${
        isDark ? 'border-slate-800 bg-slate-800/40 text-slate-200' : 'border-slate-200 bg-slate-50/50 text-slate-800'
      } leading-relaxed text-sm whitespace-pre-line font-normal`}>
        {summary}
      </div>
    </div>
  );
};
