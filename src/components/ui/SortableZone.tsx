import type { ReactNode } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useLayoutOrder } from '../../hooks/useLayoutOrder';
import { DraggablePanel } from './DraggablePanel';

interface SortableZoneProps {
  zoneId: string;
  defaultOrder: string[];
  renderPanel: (panelId: string) => ReactNode;
  /** Extra className applied to the wrapping container for each panel */
  panelClassName?: (panelId: string) => string;
  className?: string;
}

export function SortableZone({ zoneId, defaultOrder, renderPanel, panelClassName, className = '' }: SortableZoneProps) {
  const [order, setOrder] = useLayoutOrder(zoneId, defaultOrder);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      setOrder(arrayMove(order, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {order.map((panelId) => (
            <DraggablePanel key={panelId} id={panelId} className={panelClassName?.(panelId) ?? ''}>
              {renderPanel(panelId)}
            </DraggablePanel>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
