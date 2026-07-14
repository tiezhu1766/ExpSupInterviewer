import { useState } from 'react';
import type { InterviewMessage } from '../types';
import { DecisionDetail } from './DecisionDetail';
import { Brain, User, Bot, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';

interface TimelineProps {
  messages: InterviewMessage[];
  onFollowUpClick?: (index: number) => void;
}

function extractQuality(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('good')) return 'good';
  if (lower.includes('vague')) return 'vague';
  if (lower.includes('shallow')) return 'shallow';
  if (lower.includes('no data') || lower.includes('no_data')) return 'no_data';
  if (lower.includes('irrelevant')) return 'irrelevant';
  return 'no_data';
}

export function Timeline({ messages, onFollowUpClick }: TimelineProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="relative">
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

      <div className="space-y-6">
        {messages.map((msg, i) => {
          const isThinking = msg.type === 'thinking';
          const isFollowUp = msg.type === 'followup';
          const isCandidate = msg.role === 'candidate';

          if (isThinking) {
            return (
              <div key={i} className="relative flex justify-center">
                <div
                  className="relative z-10 bg-elevated/60 border border-dashed border-border rounded-xl px-5 py-3 text-sm max-w-md cursor-pointer hover:border-accent/30 transition-colors group"
                  onClick={() => toggle(i)}
                >
                  <div className="flex items-center gap-2 text-text-tertiary">
                    <Brain size={14} className="text-accent" />
                    <span className="line-clamp-2">{msg.content}</span>
                    {expanded.has(i) ? <ChevronUp size={14} className="text-text-tertiary" /> : <ChevronDown size={14} className="text-text-tertiary" />}
                  </div>
                  {expanded.has(i) && (
                    <DecisionDetail reason={msg.content} quality={extractQuality(msg.content)} />
                  )}
                </div>
              </div>
            );
          }

          if (isFollowUp) {
            return (
              <div key={i} className="relative flex md:justify-start justify-start md:ml-[52%] ml-8">
                <div
                  className="relative z-10 bg-accent-subtle border border-accent/20 rounded-xl px-5 py-3 text-sm max-w-md cursor-pointer hover:border-accent/40 transition-colors group"
                  onClick={() => {
                    toggle(i);
                    onFollowUpClick?.(i);
                  }}
                >
                  <div className="flex items-center gap-2 text-accent">
                    <CornerDownRight size={14} />
                    <span>{msg.content}</span>
                    {expanded.has(i) ? <ChevronUp size={14} className="text-accent/60" /> : <ChevronDown size={14} className="text-accent/60" />}
                  </div>
                  {expanded.has(i) && (
                    <DecisionDetail reason="Follow-up triggered by answer quality" quality={extractQuality(msg.content)} />
                  )}
                </div>
                <div className="absolute left-0 md:left-[calc(52%-8px)] top-1/2 w-3 h-3 rounded-full bg-accent -translate-y-1/2 -translate-x-1/2 z-20 ring-4 ring-bg" />
              </div>
            );
          }

          if (isCandidate) {
            return (
              <div key={i} className="relative flex md:justify-end justify-start md:mr-[52%] mr-0 ml-8">
                <div className="relative z-10 bg-accent text-text-on-accent rounded-xl px-5 py-3 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{msg.content}</span>
                  </div>
                </div>
                <div className="absolute left-0 md:left-[calc(52%-8px)] top-1/2 w-3 h-3 rounded-full bg-accent -translate-y-1/2 -translate-x-1/2 z-20 ring-4 ring-bg" />
              </div>
            );
          }

          return (
            <div key={i} className="relative flex md:justify-start justify-start md:ml-[52%] ml-8">
              <div className="relative z-10 bg-[var(--c-chat-bot-bg)] border border-[var(--c-chat-bot-border)] rounded-xl px-5 py-3 text-sm max-w-md text-[var(--c-chat-bot-text)]">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-accent" />
                  <span>{msg.content}</span>
                </div>
              </div>
              <div className="absolute left-0 md:left-[calc(52%-8px)] top-1/2 w-3 h-3 rounded-full bg-text-tertiary -translate-y-1/2 -translate-x-1/2 z-20 ring-4 ring-bg" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
