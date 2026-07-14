import { useState, memo } from 'react';
import type { InterviewMessage } from '../types';
import { Brain, User, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useTypewriter } from '../hooks/useTypewriter';
import { useTranslation } from '../i18n/useTranslation';

interface ChatBubbleProps {
  message: InterviewMessage;
  useTypewriter?: boolean;
  collapsed?: boolean;
}

const MAX_LINES = 3;

function countLines(text: string): number {
  return text.split('\n').length;
}

export const ChatBubble = memo(function ChatBubble({ message, useTypewriter: enableTypewriter = false, collapsed: forceCollapsed }: ChatBubbleProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const fullText = message.content;
  const typewriterText = useTypewriter(fullText, 18, enableTypewriter);
  const displayText = enableTypewriter ? typewriterText : fullText;
  const isLong = countLines(fullText) > MAX_LINES;
  const shouldCollapse = forceCollapsed || (isLong && !expanded);

  if (message.role === 'thinking') {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-elevated/70 border border-dashed border-border rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 max-w-md">
          <Brain size={14} className="text-accent" />
          <span className="text-text-tertiary">{displayText}</span>
        </div>
      </div>
    );
  }

  if (message.role === 'candidate') {
    return (
      <div className="flex justify-end my-3">
        <div className="flex items-end gap-2 max-w-[85%]">
          <div className="bg-accent text-text-on-accent rounded-2xl rounded-br-sm px-4 py-3 text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">
            {shouldCollapse ? `${fullText.slice(0, 100)}...` : displayText}
          </div>
          <div className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated text-text-tertiary">
            <User size={14} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start my-3">
      <div className="flex items-end gap-2 max-w-[85%]">
        <div className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent ring-1 ring-accent/20">
          <Bot size={14} />
        </div>
        <div>
          <div className="bg-[var(--c-chat-bot-bg)] border border-[var(--c-chat-bot-border)] rounded-2xl rounded-bl-sm px-4 py-3 text-sm md:text-base leading-relaxed text-[var(--c-chat-bot-text)] whitespace-pre-wrap">
            {shouldCollapse ? `${fullText.slice(0, 150)}...` : displayText}
          </div>
          {isLong && !enableTypewriter && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 ml-2 inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? t('chat.collapse') : t('chat.expand')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
