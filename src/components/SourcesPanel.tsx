import React from 'react';
import { BookOpen, Upload, Trash2, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentItem } from '../types';

interface SourcesPanelProps {
  documents: DocumentItem[];
  activeDoc: DocumentItem;
  isArabic: boolean;
  isDark?: boolean;
  isUploading: boolean;
  uploadStatus: string;
  onSelectDoc: (id: string) => void;
  onRequestDelete: (doc: DocumentItem) => void;
  onTriggerUpload: () => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  documents,
  activeDoc,
  isArabic,
  isDark = false,
  isUploading,
  uploadStatus,
  onSelectDoc,
  onRequestDelete,
  onTriggerUpload,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl border p-4 shadow-xs space-y-3 transition-colors`}>
      {/* Primary Bar: Active Source & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-blue-950/60 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'} border flex items-center justify-center shrink-0`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isArabic ? 'المستند الدراسي النشط' : 'Active Study Source'}
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.2 rounded-full font-semibold shrink-0">
                {activeDoc.pageCount} {isArabic ? 'صفحة فعلية' : 'Exact Pages'}
              </span>
            </div>
            <h2 className={`font-bold text-sm sm:text-base truncate mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`} title={activeDoc.filename}>
              {activeDoc.filename}
            </h2>
          </div>
        </div>

        {/* Buttons to Upload and Switch Files */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          <button
            onClick={onTriggerUpload}
            disabled={isUploading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-3 sm:px-4 py-2 rounded-xl text-xs transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isUploading
                ? (isArabic ? 'جارٍ قراءة الملف...' : 'Reading File...')
                : (isArabic ? 'رفع ملف دراسي' : 'Upload File')}
            </span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border ${
              isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-50 text-slate-700'
            } font-semibold px-3 py-2 rounded-xl text-xs transition-colors`}
          >
            <span className="truncate">{isArabic ? `المستندات (${documents.length})` : `Sources (${documents.length})`}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Upload Progress Status Banner */}
      {uploadStatus && (
        <div className={`${isDark ? 'bg-blue-950/60 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'} border px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 animate-pulse`}>
          <span className="animate-spin text-base">⏳</span>
          <span className="font-medium">{uploadStatus}</span>
        </div>
      )}

      {/* Expanded Sources Drawer (Google NotebookLM Style) */}
      {isOpen && (
        <div className={`pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} space-y-2`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>{isArabic ? 'اختر المستند الذي ترغب بدراسته أو احذف أي ملف:' : 'Select material to study or delete unwanted files:'}</span>
            <span>{documents.length} {isArabic ? 'ملفات مفهرسة' : 'indexed'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
            {documents.map((doc) => {
              const isActive = doc.id === activeDoc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all overflow-hidden ${
                    isActive
                      ? isDark ? 'border-blue-500 bg-blue-950/40 shadow-2xs' : 'border-blue-600 bg-blue-50/50 shadow-2xs'
                      : isDark ? 'border-slate-800 hover:border-slate-700 bg-slate-800/40' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs ${isActive ? 'text-blue-400' : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {doc.filename}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {doc.pageCount} {isArabic ? 'صفحة' : 'pages'} · {(doc.sizeKb / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isActive ? (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{isArabic ? 'نشط' : 'Active'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectDoc(doc.id)}
                        className="text-xs text-blue-500 hover:text-blue-400 font-semibold px-2 py-1"
                      >
                        {isArabic ? 'تفعيل' : 'Select'}
                      </button>
                    )}

                    {/* Delete File Button */}
                    <button
                      title={isArabic ? 'حذف هذا المستند' : 'Delete Document'}
                      onClick={() => onRequestDelete(doc)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
