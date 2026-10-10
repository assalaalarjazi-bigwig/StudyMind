import React, { useState } from 'react';
import { X, HelpCircle, MessageSquare, Eye, CheckCircle2, Target, Plus, BookOpen } from 'lucide-react';

interface WeakConceptsModalProps {
  isOpen: boolean;
  isArabic: boolean;
  isDark?: boolean;
  weakConcepts: string[];
  activeDocFilename: string;
  onClose: () => void;
  onTestConcept: (concept: string) => void;
  onChatExplain: (concept: string) => void;
  onViewDiagrams: (concept: string) => void;
  onMarkMastered: (concept: string) => void;
  onRetestAll: () => void;
  onAddConcept: (concept: string) => void;
}

export const WeakConceptsModal: React.FC<WeakConceptsModalProps> = ({
  isOpen,
  isArabic,
  isDark = false,
  weakConcepts,
  activeDocFilename,
  onClose,
  onTestConcept,
  onChatExplain,
  onViewDiagrams,
  onMarkMastered,
  onRetestAll,
  onAddConcept,
}) => {
  const [newConceptInput, setNewConceptInput] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmed = newConceptInput.trim();
    if (trimmed) {
      onAddConcept(trimmed);
      setNewConceptInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } rounded-2xl border max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-start justify-between gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  {isArabic ? 'المفاهيم التي تحتاج لتقوية' : 'Identified Weak Concepts'}
                </h3>
                <span className="text-xs bg-amber-500/15 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/25">
                  {weakConcepts.length} {isArabic ? 'نقاط' : 'topics'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5 truncate`}>
                {isArabic
                  ? `مرصودة من اختبارات ومراجعة: ${activeDocFilename}`
                  : `Detected from quizzes & reviews in: ${activeDocFilename}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title={isArabic ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Concepts List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {weakConcepts.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-500">
                {isArabic ? 'رائع! لا توجد فجوات معرفية مسجلة حالياً' : 'Great! No knowledge gaps recorded'}
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
                {isArabic
                  ? 'جميع مفاهيمك مؤكدة. يمكنك إجراء اختبار جديد أو إضافة مصطلح يدوي ترغب بمراجعته.'
                  : 'All concepts are validated. Take a quiz or add a custom term to review.'}
              </p>
            </div>
          ) : (
            weakConcepts.map((concept, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/50'
                    : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {concept}
                    </h4>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500/25 shrink-0">
                    {isArabic ? 'يحتاج تقوية' : 'Needs Review'}
                  </span>
                </div>

                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-3`}>
                  {isArabic
                    ? 'اختر أحد الإجراءات المباشرة لدراسة هذا المفهوم، أو اختباره، أو شرحه:'
                    : 'Choose a direct action to study, re-test, or explain this topic:'}
                </p>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      onTestConcept(concept);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-2xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'بدء اختبار مركز' : 'Targeted Quiz'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onChatExplain(concept);
                      onClose();
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    } font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isArabic ? 'شرح فوري بالمحادثة' : 'AI Explanation'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onViewDiagrams(concept);
                      onClose();
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    } font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors`}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isArabic ? 'المخطط التوضيحي' : 'Diagram'}</span>
                  </button>

                  <button
                    onClick={() => onMarkMastered(concept)}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs font-semibold transition-colors shrink-0"
                    title={isArabic ? 'تحديد كـ "تم إتقانه"' : 'Mark as Mastered'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تم الإتقان' : 'Mastered'}</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Quick Add Custom Concept */}
          <div className="pt-2">
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isArabic ? 'إضافة مفهوم أو مصطلح آخر ترغب بتحديده للتقوية:' : 'Add another concept to reinforce:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newConceptInput}
                onChange={(e) => setNewConceptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder={isArabic ? 'اكتب اسم المفهوم أو المصطلح...' : 'Type concept name...'}
                className={`flex-1 text-xs rounded-xl px-3.5 py-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newConceptInput.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إضافة' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/50'}`}>
          {weakConcepts.length > 0 ? (
            <button
              onClick={() => {
                onRetestAll();
                onClose();
              }}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isArabic ? 'بدء اختبار شامل لجميع المفاهيم الضعيفة' : 'Retest All Weak Concepts'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isArabic ? 'إغلاق النافذة' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
