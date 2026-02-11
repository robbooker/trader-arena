import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggablePanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DraggablePanel({ id, children, className = '' }: DraggablePanelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 flex items-center justify-center w-5 h-5 rounded text-slate-600 hover:text-slate-400 hover:bg-slate-800/60 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder"
      >
        <span className="text-[10px] leading-none select-none">&#x2807;</span>
      </button>
      {children}
    </div>
  );
}
