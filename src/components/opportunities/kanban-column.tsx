'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  value: string;
  color: string;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, count, value, color, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant="secondary" className={color}>
              {count}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {value}
          </div>
        </CardHeader>
        <CardContent
          ref={setNodeRef}
          className="space-y-3 max-h-96 overflow-y-auto min-h-[200px]"
        >
          {children.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-md">
              Drop opportunities here
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}