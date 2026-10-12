import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { ArrowRight, CheckCircle2, Sparkles, BookOpen, Brain, WifiOff, Zap } from 'lucide-react';

interface SplashScreenProps {
  isArabic: boolean;
  isDark?: boolean;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isArabic,
  isDark = true,
  onFinish,
}) => {
  const [progress, setProgress] = useState(18);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const steps = isArabic
    ? [
        { label: 'تهيئة المكتبة الأكاديمية والمستندات المحفوظة محلياً...', icon: BookOpen },
        { label: 'استرجاع الذاكرة الدراسية وسجل بطاقات الاستذكار...', icon: Brain },
        { label: 'فحص الاتصال وتجهيز المحتوى للعمل بدون إنترنت...', icon: Zap },
        { label: 'جاهز تماماً! بيئة الدراسة متاحة بكامل محتواها...', icon: CheckCircle2 },
      ]
    : [
        { label: 'Initializing academic library & cached documents...', icon: BookOpen },
        { label: 'Restoring study memory & flashcard recall decks...', icon: Brain },
        { label: 'Verifying offline readiness & persistence layer...', icon: Zap },
        { label: 'Ready! Study environment is fully accessible...', icon: CheckCircle2 },
      ];

  useEffect(() => {
    // Stage 1
    const t1 = setTimeout(() => {
      setProgress(48);
      setStepIndex(1);
    }, 450);

    // Stage 2
    const t2 = setTimeout(() => {
      setProgress(82);
      setStepIndex(2);
    }, 950);

    // Stage 3
    const t3 = setTimeout(() => {
      setProgress(100);
      setStepIndex(3);
    }, 1450);

    // Auto finish smoothly
    const t4 = setTimeout(() => {
      handleComplete();
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleComplete = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  const CurrentIcon = steps[stepIndex]?.icon || Sparkles;

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 select-none transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isDark
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'
          : 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white'
      }`}
      style={{ fontFamily: isArabic ? "'Cairo', system-ui, sans-serif" : "'Inter', system-ui, sans-serif" }}
    >
      {/* Background Radiant Glows & Grid Mesh */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Card */}
      <div className="relative flex flex-col items-center text-center max-w-md w-full px-4 sm:px-6 py-6">
        {/* Animated Brand Logo with Multi-Ring Aura */}
        <div className="relative mb-6">
          {/* Subtle Outer Pulsing Halo */}
          <div className="absolute -inset-6 rounded-3xl bg-blue-500/20 blur-2xl animate-pulse" />
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-400 to-cyan-400 opacity-60 blur-md" />

          {/* Core Masterpiece Brand Logo */}
          <BrandLogo size={96} className="relative shadow-2xl" animated={true} />
        </div>

        {/* Brand Name & Typography */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{isArabic ? 'منظومة التعلم الأكاديمي الذكي' : 'Intelligent Academic Learning System'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
            StudyMind
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
            {isArabic
              ? 'حوّل كتبك ومستنداتك إلى خرائط معرفية، بطاقات استذكار، واختبارات تفاعلية تعمل حتى دون اتصال بالإنترنت'
              : 'Transform textbooks & study materials into knowledge networks, flashcards, and adaptive practice with full offline capability.'}
          </p>
        </div>

        {/* Progress Bar & Status Message */}
        <div className="w-full max-w-xs space-y-2.5 mb-6">
          <div className="w-full bg-slate-800/90 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/70 shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-300 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-300 min-h-6">
            <CurrentIcon className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
            <span className="truncate font-medium">{steps[stepIndex]?.label}</span>
          </div>
        </div>

        {/* Fast Action Enter Button */}
        <button
          onClick={handleComplete}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 border border-blue-400/40 cursor-pointer"
        >
          <span>{isArabic ? 'الدخول للمنصة الآن' : 'Enter Study Platform'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>

        {/* Offline Ready Guarantee Badge */}
        <div className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
          <WifiOff className="w-3 h-3 text-emerald-400" />
          <span>
            {isArabic
              ? 'المحتوى المحفوظ متاح بالكامل دون اتصال بالإنترنت'
              : 'Saved materials remain fully accessible offline'}
          </span>
        </div>
      </div>
    </div>
  );
};
