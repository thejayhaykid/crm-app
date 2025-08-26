'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  currency: string;
  status: string;
  probability: number;
  closeDate: string | null;
  stageOrder: number;
  contact: Contact | null;
  _count: {
    communications: number;
    activities: number;
    notes: number;
  };
}

interface KanbanBoardProps {
  opportunities: {
    lead: Opportunity[];
    qualified: Opportunity[];
    proposal: Opportunity[];
    negotiating: Opportunity[];
    'closed-won': Opportunity[];
    'closed-lost': Opportunity[];
  };
  onOpportunityMove: (opportunityId: string, newStatus: string, newOrder: number) => Promise<void>;
  onOpportunityEdit: (opportunity: Opportunity) => void;
  onOpportunityDelete: (opportunityId: string) => Promise<void>;
}

const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-orange-100 text-orange-800' },
  { id: 'closed-won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { id: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
];

export function KanbanBoard({
  opportunities,
  onOpportunityMove,
  onOpportunityEdit,
  onOpportunityDelete,
}: KanbanBoardProps) {
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const calculateColumnValue = (opportunities: Opportunity[]) => {
    return opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunityId = active.id as string;
    
    // Find the opportunity across all columns
    const opportunity = Object.values(opportunities)
      .flat()
      .find(opp => opp.id === opportunityId);
    
    setActiveOpportunity(opportunity || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This is called when dragging over a droppable area
    // We can use this for visual feedback if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveOpportunity(null);

    if (!over) return;

    const opportunityId = active.id as string;
    const newStatus = over.id as string;
    
    // Find the current opportunity
    const currentOpportunity = Object.values(opportunities)
      .flat()
      .find(opp => opp.id === opportunityId);
    
    if (!currentOpportunity) return;

    // If dropping in the same column and same position, do nothing
    if (currentOpportunity.status === newStatus) return;

    // Calculate new order within the target column
    const targetColumnOpportunities = opportunities[newStatus as keyof typeof opportunities] || [];
    const newOrder = targetColumnOpportunities.length;

    try {
      await onOpportunityMove(opportunityId, newStatus, newOrder);
    } catch (error) {
      console.error('Failed to move opportunity:', error);
      // You might want to show a toast notification here
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {PIPELINE_STAGES.map((stage) => {
          const stageOpportunities = opportunities[stage.id as keyof typeof opportunities] || [];
          const columnValue = calculateColumnValue(stageOpportunities);
          
          return (
            <SortableContext
              key={stage.id}
              items={stageOpportunities.map(opp => opp.id)}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn
                id={stage.id}
                title={stage.label}
                count={stageOpportunities.length}
                value={formatCurrency(columnValue)}
                color={stage.color}
              >
                {stageOpportunities.map((opportunity) => (
                  <KanbanCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onEdit={onOpportunityEdit}
                    onDelete={onOpportunityDelete}
                  />
                ))}
              </KanbanColumn>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeOpportunity ? (
          <KanbanCard
            opportunity={activeOpportunity}
            onEdit={() => {}}
            onDelete={() => Promise.resolve()}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}