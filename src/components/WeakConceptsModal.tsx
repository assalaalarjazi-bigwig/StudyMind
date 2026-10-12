import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  MessageSquare,
  Eye,
  CheckCircle2,
  Target,
  Plus,
  AlertTriangle,
  FileText,
  Layers,
  Sparkles,
  Check,
  RotateCw
} from 'lucide-react';
import { WeakConceptItem } from '../types';

interface WeakConceptsModalProps {
  isOpen: boolean;
  isArabic: boolean;
  isDark?: boolean;
  weakConcepts: WeakConceptItem[];
  activeDocFilename: string;
  onClose: () => void;
  onTestConcept: (item: WeakConceptItem) => void;
  onChatExplain: (item: WeakConceptItem) => void;
  onViewDiagrams: (item: WeakConceptItem) => void;
  onMarkMastered: (id: string, title: string) => void;
  onRetestAll: () => void;
  onAddConcept: (item: Omit<WeakConceptItem, 'id' | 'recordedAt'>) => void;
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
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddConcept({
      title: newTitle.trim(),
      questionText: newQuestion.trim() || newTitle.trim(),
      correctAnswer: newAnswer.trim() || (isArabic ? 'المفهوم الأساسي المراد مراجعته' : 'Core revision takeaway'),
      explanation: isArabic
        ? 'تمت إضافة هذا المفهوم يدوياً للتقوية والمراجعة المستمرة.'
        : 'Manually added for targeted review and reinforcement.',
      sourceType: 'manual',
      docFilename: activeDocFilename,
      page: 1,
    });

    setNewTitle('');
    setNewQuestion('');
    setNewAnswer('');
    setShowAddForm(false);
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      style={{ fontFamily: isArabic ? "'Cairo', system-ui, sans-serif" : "'Inter', system-ui, sans-serif" }}
      onClick={onClose}
    >
      <div
        className={`${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        } rounded-3xl border max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-start justify-between gap-4 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'}`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <Target className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl">
                  {isArabic ? 'المفاهيم التي تحتاج إلى تقوية' : 'Identified Weak Concepts & Knowledge Gaps'}
                </h3>
                <span className="text-xs bg-amber-500/20 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {weakConcepts.length} {isArabic ? 'نقاط مرصودة' : 'points'}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 leading-relaxed`}>
                {isArabic
                  ? 'يتم رصد هذه النقاط تلقائياً عند الخطأ في أسئلة الامتحان أو تصنيف بطاقات الاستذكار بأنها صعبة، لتعرف تماماً المعلومة التي يجب تقويتها.'
                  : 'Automatically compiled from your quiz mistakes and challenging flashcards so you know exactly what to study.'}
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Concepts List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {weakConcepts.length === 0 ? (
            <div className={`p-10 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'} space-y-3`}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-emerald-500">
                {isArabic ? '✨ لا توجد فجوات معرفية مرصودة حالياً!' : '✨ No Knowledge Gaps Detected!'}
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} max-w-md mx-auto leading-relaxed`}>
                {isArabic
                  ? 'أحسنت! جميع مفاهيمك الحالية مؤكدة. عندما تجري اختباراً تجريبياً وتخطئ في أحد الأسئلة، أو تقيم بطاقة بأنها "تحتاج مراجعة"، ستظهر المعلومة الدقيقة هنا تلقائياً لتقويتها.'
                  : 'Great job! As you take quizzes and study flashcards, any question you miss will automatically appear here with the exact problem, correct answer, and explanation.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onRetestAll();
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إجراء اختبار تجريبي الآن' : 'Take a Practice Quiz Now'}</span>
                </button>
              </div>
            </div>
          ) : (
            weakConcepts.map((item, index) => (
              <div
                key={item.id || index}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 shadow-2xs ${
                  isDark
                    ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/50'
                    : 'bg-amber-50/40 border-amber-200/80 hover:border-amber-400'
                }`}
              >
                {/* Concept Header with Source Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Source Badge */}
                    {item.sourceType === 'quiz' ? (
                      <span className="text-[11px] bg-red-500/15 text-red-500 dark:text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/25 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{isArabic ? 'خطأ في اختبار تجريبي' : 'Quiz Mistake'}</span>
                      </span>
                    ) : item.sourceType === 'flashcard' ? (
                      <span className="text-[11px] bg-blue-500/15 text-blue-500 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/25 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{isArabic ? 'بطاقة استذكار تحتاج تركيز' : 'Challenging Flashcard'}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-500/15 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{isArabic ? 'مفهوم مضاف يدوياً' : 'Manually Added'}</span>
                      </span>
                    )}

                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'} hidden sm:inline`}>
                      {item.docFilename} (ص {item.page || 1})
                    </span>
                  </div>
                </div>

                {/* The Exact Question / Knowledge Prompt */}
                <div className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold leading-relaxed ${
                  isDark ? 'bg-slate-900/60 border-slate-700/80 text-slate-200' : 'bg-white border-amber-200/60 text-slate-800'
                }`}>
                  <span className="text-amber-500 font-bold ml-1">📌 {isArabic ? 'السؤال أو النقطة المطلوب فهمها:' : 'The Question / Target Concept:'}</span>
                  <span>{item.questionText}</span>
                </div>

                {/* User Mistake vs Correct Answer Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {item.userMistake && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300">
                      <span className="font-bold flex items-center gap-1 mb-1 text-red-600 dark:text-red-400">
                        <span>❌</span>
                        <span>{isArabic ? 'إجابتك السابقة التي أخطأت فيها:' : 'Your Previous Incorrect Answer:'}</span>
                      </span>
                      <p className="leading-relaxed font-medium">{item.userMistake}</p>
                    </div>
                  )}

                  <div className={`p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 ${!item.userMistake ? 'sm:col-span-2' : ''}`}>
                    <span className="font-bold flex items-center gap-1 mb-1 text-emerald-600 dark:text-emerald-400">
                      <span>✅</span>
                      <span>{isArabic ? 'الإجابة الصحيحة المعتمدة:' : 'Correct Verified Takeaway:'}</span>
                    </span>
                    <p className="leading-relaxed font-medium">{item.correctAnswer}</p>
                  </div>
                </div>

                {/* Educational Explanation */}
                {item.explanation && (
                  <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                    isDark ? 'bg-slate-900/40 border-slate-700/60 text-slate-300' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                  }`}>
                    <span className="font-bold text-blue-500 dark:text-blue-400 block mb-1">
                      💡 {isArabic ? 'التفسير الأكاديمي وسياق المعلومة من المستند:' : 'Academic Explanation & Context:'}
                    </span>
                    <p>{item.explanation}</p>
                  </div>
                )}

                {/* Direct Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  {/* 1. Test This Concept */}
                  <button
                    onClick={() => {
                      onTestConcept(item);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-colors shadow-2xs"
                    title={isArabic ? 'بدء اختبار مركز لهذا المفهوم' : 'Take targeted quiz'}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'اختبار هذا المفهوم' : 'Test This Topic'}</span>
                  </button>

                  {/* 2. Ask AI to Explain */}
                  <button
                    onClick={() => {
                      onChatExplain(item);
                      onClose();
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    } font-semibold px-3.5 py-1.5 rounded-xl text-xs transition-colors`}
                    title={isArabic ? 'اطلب من المساعد شرح هذه النقطة في المحادثة' : 'Ask AI to explain in chat'}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isArabic ? 'شرح في المحادثة' : 'Ask AI Explanation'}</span>
                  </button>

                  {/* 3. Diagrams */}
                  <button
                    onClick={() => {
                      onViewDiagrams(item);
                      onClose();
                    }}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-slate-700 hover:bg-slate-700 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                    } font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors`}
                    title={isArabic ? 'استعراض المخططات التوضيحية' : 'View diagrams'}
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{isArabic ? 'المخطط' : 'Diagram'}</span>
                  </button>

                  {/* 4. Mark Mastered */}
                  <button
                    onClick={() => onMarkMastered(item.id, item.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 rounded-xl text-xs font-semibold transition-colors shrink-0"
                    title={isArabic ? 'اضغط بعد استيعاب المفهوم لإزالته من الفجوات' : 'Mark as mastered'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isArabic ? 'تم الاستيعاب (إتقان)' : 'Mastered'}</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Add Custom Concept Expandable Form */}
          <div className="pt-2">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className={`w-full py-2.5 px-4 rounded-2xl border border-dashed text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800/60' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>{isArabic ? '+ إضافة سؤال أو مصطلح يدوي ترغب بتحديده للتقوية' : '+ Add Custom Concept to Reinforce'}</span>
              </button>
            ) : (
              <form onSubmit={handleAddSubmit} className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-amber-500">
                    {isArabic ? 'إضافة نقطة مخصصة لقائمة التقوية:' : 'Add Custom Topic for Reinforcement:'}
                  </h5>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {isArabic ? 'عنوان المفهوم (مثال: بروتوكول Handshake):' : 'Concept Title:'}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={isArabic ? 'اكتب عنوان المفهوم...' : 'Concept title...'}
                    required
                    className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {isArabic ? 'السؤال أو النقطة الدقيقة التي تجد فيها صعوبة:' : 'Target Question or Nuance:'}
                  </label>
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder={isArabic ? 'ما هي النقطة التي تحتاج لفهمها تماماً؟' : 'Question or problem statement...'}
                    className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    {isArabic ? 'الإجابة أو الملاحظة الصحيحة لتثبيت الفهم:' : 'Key Correct Takeaway:'}
                  </label>
                  <input
                    type="text"
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder={isArabic ? 'الإجابة أو القاعدة الأساسية...' : 'Correct rule or definition...'}
                    className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    {isArabic ? 'حفظ النقطة للتقوية' : 'Save Concept'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/90'}`}>
          {weakConcepts.length > 0 ? (
            <button
              onClick={() => {
                onRetestAll();
                onClose();
              }}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isArabic ? 'بدء اختبار شامل لجميع المفاهيم الضعيفة' : 'Retest All Weak Concepts'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
