import React from 'react';

import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface Ticket {
  id: string;
  typeOfWork: 'Create' | 'Review' | 'Study' | 'Correct' | 'Translate' | 'Test';
  description: string;
  timeSpend: number;
  ticketId: string;
}

interface TicketTableProps {
  tickets: Ticket[];
  onRemoveTicket: (id: string) => void;
  workTypeMeta: Record<string, { badgeClass: string }>;
  showActions?: boolean;
  className?: string;
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onRemoveTicket,
  workTypeMeta,
  showActions = true,
  className = '',
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead className='font-semibold'>Type Of Work</TableHead>
            <TableHead className='font-semibold'>Ticket ID</TableHead>
            <TableHead className='font-semibold'>Description</TableHead>
            <TableHead className='text-right font-semibold'>
              Time spent (hrs)
            </TableHead>
            {showActions && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map(ticket => (
            <TableRow key={ticket.id}>
              <TableCell>
                <Badge className={workTypeMeta[ticket.typeOfWork]?.badgeClass}>
                  {ticket.typeOfWork}
                </Badge>
              </TableCell>
              <TableCell className='font-medium'>{ticket.ticketId}</TableCell>
              <TableCell className='truncate max-w-[280px]'>
                {ticket.description}
              </TableCell>
              <TableCell className='text-right'>{ticket.timeSpend}</TableCell>
              {showActions && (
                <TableCell className='text-right'>
                  <Button
                    className='hover:bg-red-200 dark:hover:bg-red-900'
                    variant='ghost'
                    size='icon'
                    onClick={() => onRemoveTicket(ticket.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TicketTable;
