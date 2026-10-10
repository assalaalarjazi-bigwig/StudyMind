import React, { useState } from 'react';
import { Send, ArrowRight, RotateCw, BookOpen, Sparkles, Copy, Check } from 'lucide-react';
import { ChatMessage, DocumentItem } from '../types';

interface GroundedChatViewProps {
  document: DocumentItem;
  messages: ChatMessage[];
  isArabic: boolean;
  isDark?: boolean;
  isTyping: boolean;
  onSendMessage: (query: string) => void;
}

export const GroundedChatView: React.FC<GroundedChatViewProps> = ({
  document,
  messages,
  isArabic,
  isDark = false,
  isTyping,
  onSendMessage,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isTyping) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedPrompts = isArabic
    ? [
        `ما هو الموضوع الأساسي الذي يناقشه ملف "${document.filename}"؟`,
        'اشرح لي أهم المصطلحات والمفاهيم الواردة في الصفحات الأولى.',
        'ما هي أهم القواعد والمعادلات أو النتائج المذكورة في هذا المستند؟',
        'لخص لي محتوى المستند في نقاط رئيسية مع ذكر أرقام الصفحات.'
      ]
    : [
        `What is the primary topic of "${document.filename}"?`,
        'Explain the core definitions and concepts in the opening chapters.',
        'What are the key rules, theorems, or formulas in this file?',
        'Provide a chapter-by-chapter outline with page citations.'
      ];

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border overflow-hidden flex flex-col min-h-[560px] shadow-xs transition-colors`}>
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? (isArabic ? 'items-start' : 'items-end') : isArabic ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : isDark
                  ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none'
                  : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold opacity-75">
                  {m.role === 'user' ? (isArabic ? 'أنت' : 'You') : 'StudyMind'}
                </span>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopyMessage(m.id, m.content)}
                    className="opacity-60 hover:opacity-100 p-0.5 rounded transition-opacity"
                    title={isArabic ? 'نسخ الإجابة' : 'Copy'}
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>

              <p className="whitespace-pre-line text-sm sm:text-base">{m.content}</p>

              {/* Verified Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className={`mt-3 pt-2.5 border-t ${isDark ? 'border-slate-700' : 'border-slate-200/80'} text-xs`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'} block mb-1`}>
                    📚 {isArabic ? 'المصادر الموثقة من نصوص الملف:' : 'Verified Document Citations:'}
                  </span>
                  {m.citations.map((c, i) => (
                    <div key={i} className={`${isDark ? 'text-slate-400' : 'text-slate-600'} flex items-start gap-1 my-0.5`}>
                      <span className="font-bold text-blue-500 shrink-0">
                        [{isArabic ? 'صفحة' : 'Page'} {c.page}]:
                      </span>
                      <span className="italic">{c.snippet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>
              {isArabic
                ? 'جارٍ قراءة نصوص الملف وتوليد الإجابة الموثقة من المستند...'
                : 'Searching document text & formulating grounded response...'}
            </span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className={`px-4 py-2 ${isDark ? 'bg-slate-800/80 border-slate-800' : 'bg-slate-50 border-slate-100'} border-t flex items-center gap-2 overflow-x-auto text-xs`}>
        <span className="font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{isArabic ? 'اقتراحات:' : 'Suggestions:'}</span>
        </span>
        {suggestedPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => onSendMessage(prompt)}
            disabled={isTyping}
            className={`${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            } border px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 font-medium`}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className={`p-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-t flex gap-2`}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            isArabic
              ? `اسأل عن موضوع "${document.filename}" أو اطلب شرح وتوضيح أي مصطلح...`
              : `Ask about "${document.filename}" or request explanations...`
          }
          className={`flex-1 ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-800'
              : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
          } border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span>{isArabic ? 'إرسال' : 'Ask'}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
};
