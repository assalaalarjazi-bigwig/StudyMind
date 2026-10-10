import React, { useState } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
  Shuffle,
  Volume2
} from 'lucide-react';
import { Flashcard, DocumentItem } from '../types';

interface FlashcardsViewProps {
  document: DocumentItem;
  flashcards: Flashcard[];
  isArabic: boolean;
  isDark?: boolean;
  cardCountChoice: number;
  cardCategoryChoice: string;
  isGenerating: boolean;
  onCountChange: (count: number) => void;
  onCategoryChange: (cat: string) => void;
  onRegenerate: () => void;
  onUpdateMastery: (index: number, level: 0 | 1 | 2 | 3) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  document,
  flashcards,
  isArabic,
  isDark = false,
  cardCountChoice,
  cardCategoryChoice,
  isGenerating,
  onCountChange,
  onCategoryChange,
  onRegenerate,
  onUpdateMastery,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterMastery, setFilterMastery] = useState<'all' | 'needs_review' | 'mastered'>('all');
  const [customCountMode, setCustomCountMode] = useState(false);

  const currentCard = flashcards[currentIndex] || flashcards[0];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleCopyCard = (card: Flashcard) => {
    navigator.clipboard.writeText(`${card.front}\n\n${card.back}`);
    setCopiedId(card.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredList = flashcards.filter((c) => {
    if (filterMastery === 'needs_review') return c.mastery === 1;
    if (filterMastery === 'mastered') return c.mastery === 3;
    return true;
  });

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border p-4 sm:p-6 space-y-6 transition-colors`}>
      {/* 1. Customization Toolbar */}
      <div className={`${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'} border rounded-2xl p-4 transition-colors`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                ⚙️ {isArabic ? `تخصيص بطاقات الاستذكار من ${document.filename}` : `Configure Flashcards from ${document.filename}`}
              </span>
              <span className="text-xs bg-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                {flashcards.length} {isArabic ? 'بطاقة منشأة' : 'cards generated'}
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
              {isArabic
                ? 'حدد عدد البطاقات المطلوب استخراجها من ملفك ومجال التركيز الأكاديمي'
                : 'Select the exact count of flashcards to generate from your material'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Number of Cards Choice (Extended counts up to 50 + Custom) */}
            <div className={`flex items-center gap-1.5 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} border rounded-xl px-2.5 py-1.5 text-xs`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isArabic ? 'العدد:' : 'Count:'}</span>
              {!customCountMode ? (
                <select
                  value={cardCountChoice}
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
                  <option value={5}>5 {isArabic ? 'بطاقات' : 'Cards'}</option>
                  <option value={8}>8 {isArabic ? 'بطاقات' : 'Cards'}</option>
                  <option value={10}>10 {isArabic ? 'بطاقات' : 'Cards'}</option>
                  <option value={15}>15 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value={20}>20 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value={25}>25 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value={30}>30 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value={40}>40 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value={50}>50 {isArabic ? 'بطاقة' : 'Cards'}</option>
                  <option value="custom">{isArabic ? 'تحديد مخصص...' : 'Custom...'}</option>
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={cardCountChoice}
                    onChange={(e) => onCountChange(Math.max(3, Math.min(60, Number(e.target.value) || 8)))}
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

            {/* Category Focus Choice */}
            <div className={`flex items-center gap-1.5 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} border rounded-xl px-2.5 py-1.5 text-xs`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isArabic ? 'التركيز:' : 'Focus:'}</span>
              <select
                value={cardCategoryChoice}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'} bg-transparent focus:outline-none cursor-pointer`}
              >
                <option value="all">{isArabic ? 'شامل لجميع المفاهيم' : 'All Concepts'}</option>
                <option value="definition">{isArabic ? 'التعاريف والمصطلحات' : 'Definitions'}</option>
                <option value="concept">{isArabic ? 'النظريات وآليات العمل' : 'Theories & Concepts'}</option>
                <option value="formula">{isArabic ? 'المعادلات والقواعد' : 'Formulas & Rules'}</option>
                <option value="exam_prep">{isArabic ? 'أسئلة امتحانات متوقعة' : 'Exam High-Yield'}</option>
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
                  ? `توليد ${cardCountChoice} بطاقة`
                  : `Generate ${cardCountChoice} Cards`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Card Flipper (Quizlet Style with ALL controls cleanly inside) */}
      {flashcards.length > 0 && currentCard && (
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
          {/* Card Meta Indicator */}
          <div className="w-full flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span className="font-semibold">
              {isArabic
                ? `البطاقة ${currentIndex + 1} من أصل ${flashcards.length}`
                : `Card ${currentIndex + 1} of ${flashcards.length}`}
            </span>
            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-100">
              {currentCard.category?.toUpperCase() || 'CONCEPT'} · [{isArabic ? 'صفحة' : 'Page'} {currentCard.page}]
            </span>
          </div>

          {/* Clean Card Surface */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[280px] sm:min-h-[300px] cursor-pointer rounded-2xl border-2 transition-all p-6 sm:p-8 flex flex-col justify-between select-none shadow-sm hover:shadow-md"
            style={{
              backgroundColor: isFlipped ? '#f0fdf4' : '#ffffff',
              borderColor: isFlipped ? '#86efac' : '#cbd5e1'
            }}
          >
            {/* Inside Header */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{isFlipped ? (isArabic ? '💡 الإجابة والشرح الموثق' : '💡 ANSWER & EXPLANATION') : isArabic ? '❓ السؤال / المصطلح' : '❓ QUESTION / TERM'}</span>
              <span className="text-slate-400">
                {isFlipped ? (isArabic ? 'وجه الإجابة' : 'Back') : isArabic ? 'وجه السؤال' : 'Front'}
              </span>
            </div>

            {/* Inside Content */}
            <div className="my-auto py-6 text-center">
              <p className="text-lg sm:text-xl font-bold text-slate-800 leading-relaxed">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            {/* Inside Footer Hint */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                <span>{isArabic ? 'انقر على البطاقة لقلبها' : 'Click card to flip'}</span>
              </span>
              <span className="text-[11px] text-blue-600 font-semibold">
                {document.filename}
              </span>
            </div>
          </div>

          {/* Unified Bottom Console: No stray buttons outside, cleanly docked */}
          <div className="w-full mt-3 p-3 bg-slate-100 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-200">
            {/* Navigation Stepper */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isArabic ? 'السابق' : 'Prev'}</span>
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-blue-600 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isArabic ? 'اقلب البطاقة' : 'Flip Card'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>{isArabic ? 'التالي' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>

            {/* Mastery Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateMastery(currentIndex, 1)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentCard.mastery === 1
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isArabic ? 'يحتاج مراجعة' : 'Review'}</span>
              </button>

              <button
                onClick={() => onUpdateMastery(currentIndex, 3)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  currentCard.mastery === 3
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تم الإتقان' : 'Mastered'}</span>
              </button>
            </div>
          </div>

          {/* Quick Jump Numbered Pills (Shows all 8 cards so user can jump immediately) */}
          <div className="w-full flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {flashcards.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentIndex(i);
                  setIsFlipped(false);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentIndex === i
                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                    : flashcards[i].mastery === 3
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : flashcards[i].mastery === 1
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Full List View of All Cards (Resolves: "user wants to see all generated cards at once") */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>
                {isArabic
                  ? `جميع بطاقات المجموعة (${flashcards.length} بطاقة منشأة)`
                  : `All Cards in Set (${flashcards.length} cards)`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isArabic
                ? 'استعراض كامل لجميع البطاقات المستخرجة مع النصوص والتفسيرات الموثقة'
                : 'Browse all extracted flashcards with citations and mastery markers'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterMastery('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMastery === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isArabic ? 'الكل' : 'All'} ({flashcards.length})
            </button>
            <button
              onClick={() => setFilterMastery('needs_review')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMastery === 'needs_review'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {isArabic ? 'يحتاج مراجعة' : 'Review'} ({flashcards.filter((c) => c.mastery === 1).length})
            </button>
            <button
              onClick={() => setFilterMastery('mastered')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMastery === 'mastered'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isArabic ? 'تم الإتقان' : 'Mastered'} ({flashcards.filter((c) => c.mastery === 3).length})
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredList.map((card, i) => (
            <div
              key={card.id}
              className="border border-slate-200 hover:border-blue-300 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all space-y-2.5 shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600">
                  #{i + 1} · [{isArabic ? 'صفحة' : 'Page'} {card.page}]
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {card.category}
                  </span>
                  <button
                    onClick={() => handleCopyCard(card)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                    title={isArabic ? 'نسخ نص البطاقة' : 'Copy card text'}
                  >
                    {copiedId === card.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">
                  {isArabic ? 'السؤال / المصطلح:' : 'Front / Prompt:'}
                </span>
                <p className="text-sm font-bold text-slate-900">{card.front}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">
                  {isArabic ? 'الإجابة والتفسير:' : 'Back / Explanation:'}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">{card.back}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
