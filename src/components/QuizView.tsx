import React, { useState } from 'react';
import {
  HelpCircle,
  RotateCw,
  CheckCircle2,
  XCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Trophy,
  AlertTriangle,
  FileCheck,
  Award,
  RefreshCw
} from 'lucide-react';
import { QuizQuestion, DocumentItem, WeakConceptItem } from '../types';

interface QuizViewProps {
  document: DocumentItem;
  questions: QuizQuestion[];
  isArabic: boolean;
  isDark?: boolean;
  questionCountChoice: number;
  difficultyChoice: string;
  isGenerating: boolean;
  onCountChange: (count: number) => void;
  onDifficultyChange: (diff: string) => void;
  onRegenerate: () => void;
  onRecordWeakConcept: (item: Omit<WeakConceptItem, 'id' | 'recordedAt'>) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  document,
  questions,
  isArabic,
  isDark = false,
  questionCountChoice,
  difficultyChoice,
  isGenerating,
  onCountChange,
  onDifficultyChange,
  onRegenerate,
  onRecordWeakConcept,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, { isCorrect: boolean; explanation: string }>>({});
  const [viewMode, setViewMode] = useState<'stepper' | 'sheet'>('stepper');
  const [isFinished, setIsFinished] = useState(false);
  const [sheetGraded, setSheetGraded] = useState(false);
  const [customCountMode, setCustomCountMode] = useState(false);

  const currentQ = questions[currentQIndex] || questions[0];

  const handleSelectOption = (qIdx: number, option: string) => {
    if (sheetGraded || submittedAnswers[qIdx]) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleSubmitQuestion = (qIdx: number) => {
    const question = questions[qIdx];
    const userAns = selectedAnswers[qIdx];
    if (!userAns || !question) return;

    const isCorrect = question.correctAnswer.includes(userAns);
    setSubmittedAnswers((prev) => ({
      ...prev,
      [qIdx]: { isCorrect, explanation: question.explanation },
    }));

    if (!isCorrect) {
      onRecordWeakConcept({
        title: question.conceptTag || (isArabic ? 'سؤال اختبار تجريبي' : 'Practice Quiz Question'),
        questionText: question.questionText,
        userMistake: userAns,
        correctAnswer: question.correctAnswer.join(', '),
        explanation: question.explanation,
        sourceType: 'quiz',
        docFilename: document.filename,
        page: question.page,
      });
    }
  };

  // Grade ALL questions at once for Sheet Mode
  const handleGradeAllSheet = () => {
    const newSubmitted: Record<number, { isCorrect: boolean; explanation: string }> = {};
    questions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      const isCorrect = userAns ? q.correctAnswer.includes(userAns) : false;
      newSubmitted[idx] = {
        isCorrect,
        explanation: q.explanation
      };
      if (!isCorrect) {
        onRecordWeakConcept({
          title: q.conceptTag || (isArabic ? 'سؤال اختبار تجريبي' : 'Practice Quiz Question'),
          questionText: q.questionText,
          userMistake: userAns || (isArabic ? 'لم يتم الاختيار' : 'No option chosen'),
          correctAnswer: q.correctAnswer.join(', '),
          explanation: q.explanation,
          sourceType: 'quiz',
          docFilename: document.filename,
          page: q.page,
        });
      }
    });

    setSubmittedAnswers(newSubmitted);
    setSheetGraded(true);
    setIsFinished(true);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    Object.values(submittedAnswers).forEach((ans) => {
      if (ans.isCorrect) score += 1;
    });
    return score;
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setSubmittedAnswers({});
    setCurrentQIndex(0);
    setIsFinished(false);
    setSheetGraded(false);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const score = calculateScore();
  const percentage = Math.round((score / (questions.length || 1)) * 100);

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border p-4 sm:p-6 space-y-6 transition-colors`}>
      {/* 1. Quiz Settings Toolbar */}
      <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4 transition-colors`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                🎯 {isArabic ? `تخصيص الاختبار من ${document.filename}` : `Configure Practice Quiz from ${document.filename}`}
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                {questions.length} {isArabic ? 'أسئلة جاهزة' : 'questions ready'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              {isArabic
                ? 'حدد عدد الأسئلة ومستوى الصعوبة المناسب لمراجعتك'
                : 'Define the target question count and testing difficulty'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Number of Questions Selector (Extended up to 40 + custom) */}
            <div className={`flex items-center gap-1.5 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} border rounded-xl px-2.5 py-1.5 text-xs`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isArabic ? 'العدد:' : 'Count:'}</span>
              {!customCountMode ? (
                <select
                  value={questionCountChoice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setCustomCountMode(true);
                    } else {
                      onCountChange(Number(val));
                    }
                  }}
                  className="font-bold text-blue-500 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value={3}>3 {isArabic ? 'أسئلة' : 'Questions'}</option>
                  <option value={5}>5 {isArabic ? 'أسئلة' : 'Questions'}</option>
                  <option value={8}>8 {isArabic ? 'أسئلة' : 'Questions'}</option>
                  <option value={10}>10 {isArabic ? 'أسئلة' : 'Questions'}</option>
                  <option value={15}>15 {isArabic ? 'سؤالاً' : 'Questions'}</option>
                  <option value={20}>20 {isArabic ? 'سؤالاً' : 'Questions'}</option>
                  <option value={25}>25 {isArabic ? 'سؤالاً' : 'Questions'}</option>
                  <option value={30}>30 {isArabic ? 'سؤالاً' : 'Questions'}</option>
                  <option value={40}>40 {isArabic ? 'سؤالاً' : 'Questions'}</option>
                  <option value="custom">{isArabic ? 'تحديد مخصص...' : 'Custom...'}</option>
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={2}
                    max={40}
                    value={questionCountChoice}
                    onChange={(e) => onCountChange(Math.max(2, Math.min(40, Number(e.target.value) || 5)))}
                    className="w-12 font-bold text-blue-500 bg-transparent focus:outline-none text-center"
                  />
                  <button
                    onClick={() => setCustomCountMode(false)}
                    className="text-[10px] text-slate-400 hover:text-blue-500 underline"
                  >
                    {isArabic ? 'قائمة' : 'List'}
                  </button>
                </div>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className={`flex items-center gap-1.5 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} border rounded-xl px-2.5 py-1.5 text-xs`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isArabic ? 'الصعوبة:' : 'Difficulty:'}</span>
              <select
                value={difficultyChoice}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} bg-transparent focus:outline-none cursor-pointer`}
              >
                <option value="easy">{isArabic ? 'سهل (أساسي)' : 'Easy (Foundational)'}</option>
                <option value="medium">{isArabic ? 'متوسط (قياسي)' : 'Medium (Standard)'}</option>
                <option value="hard">{isArabic ? 'صعب (متقدم)' : 'Hard (Advanced)'}</option>
                <option value="exam">{isArabic ? 'شامل امتحانات' : 'Exam Comprehensive'}</option>
              </select>
            </div>

            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>
                {isGenerating
                  ? isArabic
                    ? 'جارٍ التوليد...'
                    : 'Generating...'
                  : isArabic
                  ? `توليد ${questionCountChoice} أسئلة`
                  : `Generate ${questionCountChoice} Questions`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mode Toggle & Question Navigation Ribbon */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {/* Numbered Stepper Buttons: Shows ALL questions directly */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">
            {isArabic ? 'الأسئلة:' : 'Questions:'}
          </span>
          {questions.map((q, idx) => {
            const isAns = submittedAnswers[idx];
            const isCurr = currentQIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQIndex(idx);
                  if (viewMode === 'sheet') {
                    const el = window.document.getElementById(`q-card-${idx}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    setIsFinished(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 border ${
                  isCurr
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs ring-2 ring-blue-300'
                    : isAns?.isCorrect
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : isAns && !isAns.isCorrect
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : selectedAnswers[idx]
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{idx + 1}</span>
                {isAns?.isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {isAns && !isAns.isCorrect && <XCircle className="w-3 h-3 text-red-500" />}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className={`flex items-center gap-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto`}>
          <button
            onClick={() => setViewMode('stepper')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              viewMode === 'stepper'
                ? isDark ? 'bg-slate-900 text-blue-400 shadow-2xs' : 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-400'
            }`}
          >
            {isArabic ? 'سؤال بسؤال' : 'One-by-One'}
          </button>
          <button
            onClick={() => setViewMode('sheet')}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
              viewMode === 'sheet'
                ? isDark ? 'bg-slate-900 text-blue-400 shadow-2xs' : 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-400'
            }`}
          >
            {isArabic ? 'ورقة الاختبار كاملة' : 'All Questions'}
          </button>
        </div>
      </div>

      {/* 3. Overall Score Card Banner (Shown in Results or after Sheet Grading) */}
      {(isFinished || sheetGraded) && (
        <div className={`p-5 rounded-2xl border ${
          percentage >= 70
            ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isDark ? 'bg-amber-950/40 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
        } transition-all space-y-3`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${
                percentage >= 70 ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base">
                  {isArabic
                    ? percentage >= 70
                      ? '🎉 أداء ممتاز! تم اجتياز الاختبار بنجاح'
                      : '⚠️ تم إنهاء الاختبار - راجع المفاهيم الضعيفة'
                    : percentage >= 70
                    ? '🎉 Excellent performance! Test passed'
                    : '⚠️ Test completed - review weak concepts'}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {isArabic
                    ? `أجبت على ${score} إجابة صحيحة من أصل ${questions.length} أسئلة (${percentage}%)`
                    : `Scored ${score} / ${questions.length} correct questions (${percentage}%)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetQuiz}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إعادة الاختبار' : 'Retry Quiz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Stepper Mode (Single Question Focus) */}
      {viewMode === 'stepper' && !isFinished ? (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-blue-500">
              {currentQ.conceptTag}
            </span>
          </div>

          <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'} leading-snug`}>
            {currentQ.questionText}
          </h3>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options?.map((opt, i) => {
              const isSelected = selectedAnswers[currentQIndex] === opt;
              const isSubmitted = Boolean(submittedAnswers[currentQIndex]);
              const isCorrectOpt = currentQ.correctAnswer.includes(opt);

              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(currentQIndex, opt)}
                  disabled={isSubmitted}
                  className={`w-full text-start p-3.5 rounded-xl border text-sm font-medium transition-all ${
                    isSubmitted && isCorrectOpt
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                      : isSubmitted && isSelected && !isCorrectOpt
                      ? 'border-red-500 bg-red-500/15 text-red-300'
                      : isSelected
                      ? 'border-blue-600 bg-blue-500/20 text-blue-300 font-semibold ring-2 ring-blue-400/40'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 bg-slate-800/60 text-slate-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-xs font-bold shrink-0`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isSubmitted && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Box upon submission */}
          {submittedAnswers[currentQIndex] && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                submittedAnswers[currentQIndex].isCorrect
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : isDark ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-red-50 border-red-300 text-red-900'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {submittedAnswers[currentQIndex].isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{isArabic ? 'إجابة صحيحة وموثقة!' : 'Correct Answer!'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>{isArabic ? 'إجابة خاطئة. الإجابة الصحيحة هي: ' : 'Incorrect. The correct answer is: '}</span>
                    <span className="underline">{currentQ.correctAnswer.join(', ')}</span>
                  </>
                )}
              </div>
              <p className="mt-1 opacity-90">{submittedAnswers[currentQIndex].explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className={`px-4 py-2 text-xs font-bold rounded-xl border ${isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-50 text-slate-700'} disabled:opacity-30 transition-colors`}
            >
              {isArabic ? 'السابق' : 'Previous'}
            </button>

            {!submittedAnswers[currentQIndex] ? (
              <button
                onClick={() => handleSubmitQuestion(currentQIndex)}
                disabled={!selectedAnswers[currentQIndex]}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {isArabic ? 'تحقق من الإجابة' : 'Check Answer'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1"
              >
                <span>
                  {currentQIndex < questions.length - 1
                    ? isArabic
                      ? 'السؤال التالي ⬅️'
                      : 'Next Question ➡️'
                    : isArabic
                    ? 'عرض النتيجة النهائية'
                    : 'Show Final Score'}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* 5. All Questions Sheet Mode (Fixes user feedback: grades all and shows whole exam result) */}
      {viewMode === 'sheet' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {isArabic
                ? `تم الإجابة على ${answeredCount} من ${questions.length} أسئلة`
                : `Answered ${answeredCount} of ${questions.length} questions`}
            </span>
            {!sheetGraded && (
              <span className="text-blue-500 font-semibold">
                {isArabic ? 'اختر إجاباتك ثم انقر على تصحيح ورقة الاختبار بالكامل' : 'Select answers then submit the full sheet'}
              </span>
            )}
          </div>

          <div className="space-y-5">
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[idx];
              const isGraded = Boolean(submittedAnswers[idx]);
              const isCorr = submittedAnswers[idx]?.isCorrect;

              return (
                <div
                  key={q.id}
                  id={`q-card-${idx}`}
                  className={`border rounded-xl p-4 sm:p-5 transition-all space-y-3 ${
                    isGraded && isCorr
                      ? isDark ? 'border-emerald-800 bg-emerald-950/20' : 'border-emerald-300 bg-emerald-50/50'
                      : isGraded && !isCorr
                      ? isDark ? 'border-red-800 bg-red-950/20' : 'border-red-300 bg-red-50/50'
                      : isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-500">
                      {isArabic ? `السؤال ${idx + 1}` : `Question ${idx + 1}`} · {q.conceptTag}
                    </span>
                    <div className="flex items-center gap-2">
                      {isGraded && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isCorr ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {isCorr ? (isArabic ? 'صحيح' : 'Correct') : (isArabic ? 'خاطئ' : 'Incorrect')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm sm:text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {q.questionText}
                  </p>

                  {/* Options */}
                  <div className="space-y-1.5">
                    {q.options?.map((opt, i) => {
                      const isSel = userAns === opt;
                      const isCorrOpt = q.correctAnswer.includes(opt);

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectOption(idx, opt)}
                          disabled={sheetGraded}
                          className={`w-full text-start p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                            sheetGraded && isCorrOpt
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                              : sheetGraded && isSel && !isCorrOpt
                              ? 'border-red-500 bg-red-500/20 text-red-300 font-semibold line-through'
                              : isSel
                              ? 'border-blue-600 bg-blue-500/20 text-blue-300 font-bold ring-2 ring-blue-400/40'
                              : isDark
                              ? 'border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 rounded-md ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-xs font-bold shrink-0`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {sheetGraded && isCorrOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {sheetGraded && isSel && !isCorrOpt && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation (Shown when sheet is graded) */}
                  {sheetGraded && submittedAnswers[idx] && (
                    <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                      isCorr
                        ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : isDark ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      <strong className="block mb-0.5">
                        💡 {isArabic ? 'التفسير التوثيقي من نص المستند:' : 'Grounded Explanation:'}
                      </strong>
                      <p>{submittedAnswers[idx].explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unified Finish & Grade Entire Sheet Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              {isArabic
                ? sheetGraded
                  ? `اكتمل التصحيح! النتيجة: ${score} من أصل ${questions.length}`
                  : `أجبت عن ${answeredCount} من ${questions.length} أسئلة`
                : sheetGraded
                ? `Graded! Score: ${score} / ${questions.length}`
                : `Answered ${answeredCount} of ${questions.length}`}
            </span>

            {!sheetGraded ? (
              <button
                onClick={handleGradeAllSheet}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>{isArabic ? 'تصحيح وإنهاء ورقة الاختبار بالكامل 📝' : 'Submit & Grade Entire Exam 📝'}</span>
              </button>
            ) : (
              <button
                onClick={resetQuiz}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إعادة الاختبار من البداية' : 'Retry Full Exam'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
