import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { DecisionNode } from '../types';

interface DecisionTreeProps {
  nodes: DecisionNode[];
}

const statusConfig: Record<string, { Icon: typeof CheckCircle2; color: string }> = {
  success: { Icon: CheckCircle2, color: 'text-success' },
  failure: { Icon: XCircle, color: 'text-danger' },
  running: { Icon: Loader2, color: 'text-warning' },
};

export function DecisionTree({ nodes }: DecisionTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="space-y-0">
      {nodes.map((node, i) => {
        const { Icon, color } = statusConfig[node.status] ?? statusConfig.running;
        const isLast = i === nodes.length - 1;

        return (
          <div key={i} className="relative flex gap-3">
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border-subtle" />
            )}
            <Icon
              size={22}
              className={`${color} ${node.status === 'running' ? 'animate-spin' : ''} shrink-0 z-10`}
            />
            <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
              <p className="text-sm font-medium text-text-primary leading-6">{node.name}</p>
              {node.note && (
                <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{node.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
