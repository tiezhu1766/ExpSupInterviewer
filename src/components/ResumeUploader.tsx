import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import type { ParsedResume } from '../types';
import { api } from '../services/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { FileUp, FileText, CheckCircle2, RotateCcw, Loader2, Upload } from 'lucide-react';

interface ResumeUploaderProps {
  onParsed: (resume: ParsedResume) => void;
}

export function ResumeUploader({ onParsed }: ResumeUploaderProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleParse = useCallback(async (input: { file?: File; text?: string }) => {
    setLoading(true);
    try {
      const result = await api.parseResume(input);
      setParsed(result);
      onParsed(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onParsed]);

  const handleFile = useCallback((file: File) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (allowed.includes(file.type) || ['pdf', 'txt', 'md', 'docx'].includes(ext || '')) {
      handleParse({ file });
    }
  }, [handleParse]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleTextSubmit = useCallback(() => {
    if (text.trim()) handleParse({ text: text.trim() });
  }, [text, handleParse]);

  if (parsed) {
    return (
      <Card hover={false}>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success ring-1 ring-success/20">
            <CheckCircle2 size={22} strokeWidth={2} />
          </div>
          <div>
            <p className="text-text-primary font-semibold font-heading">{parsed.name}</p>
            <p className="text-text-tertiary text-sm">{t('resumeUploader.parsed.success')}</p>
          </div>
        </div>
        {parsed.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {parsed.skills.map(s => <Badge key={s}>{s}</Badge>)}
          </div>
        )}
        <button
          onClick={() => { setParsed(null); setText(''); }}
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent transition"
        >
          <RotateCcw size={14} />
          {t('resumeUploader.reupload')}
        </button>
      </Card>
    );
  }

  return (
    <Card hover={false}>
      <div className="flex gap-2 mb-5 p-1 rounded-xl bg-elevated border border-subtle w-fit">
        <button
          onClick={() => setMode('file')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'file' ? 'bg-surface text-text-primary border border-border' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <FileUp size={16} />
          {t('resumeUploader.mode.pdf')}
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'text' ? 'bg-surface text-text-primary border border-border' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <FileText size={16} />
          {t('resumeUploader.mode.text')}
        </button>
      </div>

      {mode === 'file' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition ${
            dragOver
              ? 'border-accent bg-accent-subtle'
              : 'border-border bg-elevated/40 hover:border-text-tertiary'
          }`}
        >
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition ${dragOver ? 'bg-accent/20 text-accent' : 'bg-elevated text-text-tertiary'}`}>
            <Upload size={26} strokeWidth={1.5} />
          </div>
          <p className="text-text-secondary font-medium">{t('resumeUploader.file.drop')}</p>
          <p className="text-text-tertiary text-sm mt-1">{t('resumeUploader.file.browse')}</p>
          <input
            type="file" accept=".pdf,.txt,.md,.docx"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('resumeUploader.text.placeholder')}
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none min-h-[200px] resize-y transition"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!text.trim() || loading}
            className="mt-4 w-full rounded-xl px-6 py-3 font-semibold bg-accent text-text-on-accent hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
            {t('resumeUploader.parse')}
          </button>
        </div>
      )}

      {loading && mode === 'file' && (
        <div className="mt-5 flex items-center justify-center gap-2 text-accent">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm font-medium">{t('resumeUploader.parsing')}</span>
        </div>
      )}
    </Card>
  );
}
