import React from 'react';
import { CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const Toast: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            t.type === 'success'
              ? 'bg-emerald-900/95 text-white border-emerald-700'
              : t.type === 'error'
              ? 'bg-red-900/95 text-white border-red-700'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-1 text-white/70 hover:text-white rounded-lg transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  docTitle: string;
  isArabic: boolean;
  isDark?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, docTitle, isArabic, isDark = false, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl max-w-md w-full p-6 shadow-2xl border animate-in fade-in zoom-in duration-150`}>
        <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-100 text-red-600'} flex items-center justify-center mx-auto mb-4`}>
          <Trash2 className="w-6 h-6" />
        </div>
        <h3 className={`text-lg font-bold text-center ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {isArabic ? 'تأكيد حذف المستند الدراسي' : 'Confirm Document Deletion'}
        </h3>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} text-center mt-2 leading-relaxed`}>
          {isArabic
            ? `هل أنت متأكد من رغبتك في حذف "${docTitle}"؟ سيتم حذف جميع المحادثات والبطاقات المرتبطة به من الذاكرة.`
            : `Are you sure you want to delete "${docTitle}"? All associated conversation history and flashcards will be removed.`}
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'} transition-colors`}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
          >
            {isArabic ? 'نعم، احذف المستند' : 'Yes, Delete Document'}
          </button>
        </div>
      </div>
    </div>
  );
};
