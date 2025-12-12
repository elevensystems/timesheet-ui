import React, { useState } from 'react';

import { Check, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

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
  onEditTicket?: (
    id: string,
    field: keyof Ticket,
    value: string | number
  ) => void;
  workTypeMeta: Record<string, { badgeClass: string; icon?: React.ReactNode }>;
  typeOfWorkOptions?: Array<{
    value: Ticket['typeOfWork'];
    label: string;
    icon?: React.ReactNode;
    badgeClass: string;
  }>;
  showActions?: boolean;
  allowEdit?: boolean;
  className?: string;
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onRemoveTicket,
  onEditTicket,
  workTypeMeta,
  typeOfWorkOptions = [],
  showActions = true,
  allowEdit = false,
  className = '',
}) => {
  const [editingCell, setEditingCell] = useState<{
    ticketId: string;
    field: keyof Ticket;
  } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');

  const startEditing = (
    ticketId: string,
    field: keyof Ticket,
    currentValue: string | number
  ) => {
    if (!allowEdit || !onEditTicket) return;
    setEditingCell({ ticketId, field });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell && onEditTicket) {
      onEditTicket(editingCell.ticketId, editingCell.field, editValue);
    }
    setEditingCell(null);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const isEditing = (ticketId: string, field: keyof Ticket) => {
    return editingCell?.ticketId === ticketId && editingCell?.field === field;
  };

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
                {isEditing(ticket.id, 'typeOfWork') ? (
                  <div className='flex items-center gap-2'>
                    <Select
                      value={editValue as string}
                      onValueChange={value => setEditValue(value)}
                    >
                      <SelectTrigger className='w-[140px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOfWorkOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.icon ? (
                              <div className='flex items-center gap-2'>
                                {option.icon}
                                <span>{option.label}</span>
                              </div>
                            ) : (
                              option.label
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size='icon' variant='ghost' onClick={saveEdit}>
                      <Check className='h-4 w-4 text-green-600' />
                    </Button>
                    <Button size='icon' variant='ghost' onClick={cancelEdit}>
                      <X className='h-4 w-4 text-red-600' />
                    </Button>
                  </div>
                ) : (
                  <Badge
                    className={`${workTypeMeta[ticket.typeOfWork]?.badgeClass} ${allowEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() =>
                      startEditing(ticket.id, 'typeOfWork', ticket.typeOfWork)
                    }
                  >
                    <div className='flex items-center gap-1.5'>
                      {workTypeMeta[ticket.typeOfWork]?.icon}
                      <span>{ticket.typeOfWork}</span>
                    </div>
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {isEditing(ticket.id, 'ticketId') ? (
                  <div className='flex items-center gap-2'>
                    <Input
                      value={editValue as string}
                      onChange={e => setEditValue(e.target.value)}
                      className='w-[180px]'
                      autoFocus
                    />
                    <Button size='icon' variant='ghost' onClick={saveEdit}>
                      <Check className='h-4 w-4 text-green-600' />
                    </Button>
                    <Button size='icon' variant='ghost' onClick={cancelEdit}>
                      <X className='h-4 w-4 text-red-600' />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`font-medium ${allowEdit ? 'cursor-pointer hover:bg-muted px-2 py-1 rounded' : ''}`}
                    onClick={() =>
                      startEditing(ticket.id, 'ticketId', ticket.ticketId)
                    }
                  >
                    {ticket.ticketId}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {isEditing(ticket.id, 'description') ? (
                  <div className='flex items-center gap-2'>
                    <Textarea
                      value={editValue as string}
                      onChange={e => setEditValue(e.target.value)}
                      className='min-w-[280px]'
                      rows={3}
                      autoFocus
                    />
                    <div className='flex flex-col gap-1'>
                      <Button size='icon' variant='ghost' onClick={saveEdit}>
                        <Check className='h-4 w-4 text-green-600' />
                      </Button>
                      <Button size='icon' variant='ghost' onClick={cancelEdit}>
                        <X className='h-4 w-4 text-red-600' />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span
                    className={`truncate max-w-[280px] block ${allowEdit ? 'cursor-pointer hover:bg-muted px-2 py-1 rounded' : ''}`}
                    onClick={() =>
                      startEditing(ticket.id, 'description', ticket.description)
                    }
                    title={ticket.description}
                  >
                    {ticket.description}
                  </span>
                )}
              </TableCell>
              <TableCell className='text-right'>
                {isEditing(ticket.id, 'timeSpend') ? (
                  <div className='flex items-center justify-end gap-2'>
                    <Input
                      type='number'
                      step='0.1'
                      value={editValue as number}
                      onChange={e =>
                        setEditValue(parseFloat(e.target.value) || 0)
                      }
                      className='w-[100px]'
                      autoFocus
                    />
                    <Button size='icon' variant='ghost' onClick={saveEdit}>
                      <Check className='h-4 w-4 text-green-600' />
                    </Button>
                    <Button size='icon' variant='ghost' onClick={cancelEdit}>
                      <X className='h-4 w-4 text-red-600' />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={`${allowEdit ? 'cursor-pointer hover:bg-muted px-2 py-1 rounded inline-block' : ''}`}
                    onClick={() =>
                      startEditing(ticket.id, 'timeSpend', ticket.timeSpend)
                    }
                  >
                    {ticket.timeSpend}
                  </span>
                )}
              </TableCell>
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
