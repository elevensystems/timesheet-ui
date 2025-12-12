'use client';

import React, { useMemo, useState } from 'react';

import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CirclePlus,
  Eye,
  FlaskConical,
  Languages,
  Pencil,
  Plus,
  SquareCheckBig,
  Tags,
  UserRoundCog,
} from 'lucide-react';
import { ZodError, z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createTimesheetJob, getJobStatus } from '@/utils/apiCalls';
import {
  isValidDatesList,
  sanitizeAccount,
  sanitizeDates,
  sanitizeDescription,
  sanitizeHours,
  sanitizeTicketId,
  sanitizeToken,
} from '@/utils/sanitize';

import FormFooter from './FormFooter';
import InputField from './InputField';
import ProgressBar from './ProgressBar';
import SelectField from './SelectField';
import SubmitButton from './SubmitButton';
import TextAreaField from './TextAreaField';
import TicketTable from './TicketTable';
import type { Ticket } from './TicketTable';

// Zod v4 schemas
const Step1Schema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(128, 'Username too long'),
  token: z.string().min(1, 'Jira Token is required').max(256, 'Token too long'),
});

// Jira ticket format: uppercase alphanumerics + dash + number, e.g. C99KBBATC2025-37
const JIRA_TICKET_REGEX = /^[A-Z0-9]+-\d+$/;
const TicketSchema = z.object({
  id: z.string().optional().default(''),
  typeOfWork: z.enum([
    'Create',
    'Review',
    'Study',
    'Correct',
    'Translate',
    'Test',
  ]),
  description: z.string().min(1, 'Description is required').max(1000),
  timeSpend: z
    .number()
    .min(0.1, 'Minimum 0.1 hours')
    .max(8, 'Max 8 hours')
    .refine(v => /^\d+(\.\d{1,2})?$/.test(String(v)), {
      message: 'Max 2 decimal places',
    }),
  ticketId: z
    .string()
    .min(1, 'Ticket ID is required')
    .max(128, 'Ticket ID too long')
    .regex(
      JIRA_TICKET_REGEX,
      'Ticket ID must match format ABC-123 (e.g., C99KBBATC2025-37)'
    ),
});

const DatesSchema = z
  .string()
  .min(1, 'Dates are required')
  .transform(s => s.trim())
  .refine((val: string) => isValidDatesList(val), {
    message: 'Dates must be in format: 20/Aug/25, 21/Aug/25, 22/Aug/25',
  })
  .refine(
    (val: string) => {
      const parts = val
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      const uniq = new Set(parts.map(p => p.toUpperCase()));
      return uniq.size === parts.length;
    },
    { message: 'Duplicate dates are not allowed' }
  );

const SubmitPayloadSchema = z.object({
  username: Step1Schema.shape.username,
  token: Step1Schema.shape.token,
  dates: DatesSchema,
  tickets: z.array(TicketSchema).min(1, 'Please add at least one ticket'),
});

// removed global error messaging helper

function zodToFieldErrors(err: unknown, defaultKey?: string) {
  const result: Record<string, string> = {};
  if (err instanceof ZodError) {
    for (const issue of err.issues) {
      const key = (issue.path[0] as string | undefined) ?? defaultKey;
      if (key) result[key] = issue.message;
    }
  }
  return result;
}

// Central definition of work type metadata
const TYPE_OF_WORK_OPTIONS: Array<{
  value: Ticket['typeOfWork'];
  label: string;
  icon: React.ReactNode;
  badgeClass: string; // tailwind classes for badge background/text
}> = [
  {
    value: 'Create',
    label: 'Create',
    icon: <Pencil className='h-4 w-4 text-muted-foreground' />,
    badgeClass: 'bg-green-200 dark:bg-green-900 text-black dark:text-green-100',
  },
  {
    value: 'Review',
    label: 'Review',
    icon: <Eye className='h-4 w-4 text-muted-foreground' />,
    badgeClass: 'bg-red-200 dark:bg-red-900 text-black dark:text-red-100',
  },
  {
    value: 'Study',
    label: 'Study',
    icon: <BookOpen className='h-4 w-4 text-muted-foreground' />,
    badgeClass:
      'bg-indigo-200 dark:bg-indigo-900 text-black dark:text-indigo-100',
  },
  {
    value: 'Correct',
    label: 'Correct',
    icon: <SquareCheckBig className='h-4 w-4 text-muted-foreground' />,
    badgeClass:
      'bg-yellow-200 dark:bg-yellow-900 text-black dark:text-yellow-100',
  },
  {
    value: 'Translate',
    label: 'Translate',
    icon: <Languages className='h-4 w-4 text-muted-foreground' />,
    badgeClass:
      'bg-purple-200 dark:bg-purple-900 text-black dark:text-purple-100',
  },
  {
    value: 'Test',
    label: 'Test',
    icon: <FlaskConical className='h-4 w-4 text-muted-foreground' />,
    badgeClass: 'bg-blue-200 dark:bg-blue-900 text-black dark:text-blue-100',
  },
];

const workTypeMeta = TYPE_OF_WORK_OPTIONS.reduce<
  Record<string, { badgeClass: string; icon: React.ReactNode }>
>((acc, cur) => {
  acc[cur.value] = { badgeClass: cur.badgeClass, icon: cur.icon };
  return acc;
}, {});

const Form: React.FC = () => {
  // steps: 1=Setup, 2=Log Ticket, 3=Review, 4=Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [dates, setDates] = useState('');
  const [jiraInstance, setJiraInstance] = useState<
    'jira9' | 'jiradc' | 'jira3'
  >('jira9');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket>({
    id: '',
    typeOfWork: 'Create',
    description: '',
    timeSpend: 0.5,
    ticketId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hoursError, setHoursError] = useState<string>('');
  // Job tracking state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobProcessed, setJobProcessed] = useState(0);
  const [jobFailed, setJobFailed] = useState(0);
  const [jobStatus, setJobStatus] = useState<
    'in-progress' | 'completed' | 'failed' | null
  >(null);
  const [jobErrors, setJobErrors] = useState<
    Array<{ date: string; error: string; ticketId: string }>
  >([]);
  // success message is shown via dialog and success screen
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');

  const showMessageDialog = (title: string, message: string) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  };

  // Poll job status
  const pollJobStatus = React.useCallback(async (currentJobId: string) => {
    try {
      const status = await getJobStatus(currentJobId);
      setJobProgress(status.progress);
      setJobProcessed(status.processed);
      setJobFailed(status.failed);
      setJobTotal(status.total);
      setJobStatus(status.status);

      // Capture errors if present
      if (status.errors && status.errors.length > 0) {
        setJobErrors(status.errors);
      }

      if (status.status === 'completed') {
        showMessageDialog('Success', 'All timesheets submitted successfully!');
        setStep(4);
        return true; // Stop polling
      } else if (status.status === 'failed') {
        const errorMsg =
          status.failed > 0
            ? `Job completed with ${status.failed} failed tasks. Check the details for more information.`
            : 'Job failed. Please try again.';
        toast.error(errorMsg);
        setStep(4);
        return true; // Stop polling
      }
      return false; // Continue polling
    } catch (error) {
      console.error('Error polling job status:', error);
      return false;
    }
  }, []);

  // Start polling when job is created
  React.useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      const shouldStop = await pollJobStatus(jobId);
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [jobId, jobStatus, pollJobStatus]);

  const handleAddTicket = () => {
    setHoursError('');
    // sanitize inputs
    const sanitized = {
      id: '',
      typeOfWork: currentTicket.typeOfWork,
      description: sanitizeDescription(currentTicket.description),
      timeSpend: sanitizeHours(currentTicket.timeSpend),
      ticketId: sanitizeTicketId(currentTicket.ticketId),
    } as const;

    try {
      TicketSchema.parse(sanitized);
      setFieldErrors(prev => {
        const next = { ...prev } as Record<string, string>;
        delete next.ticketId;
        delete next.description;
        delete next.timeSpend;
        delete next.typeOfWork;
        return next;
      });
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(e) }));
      return;
    }

    // Generate a unique ID for this ticket for tracking in the UI
    const newTicket = {
      ...sanitized,
      id: Date.now().toString(),
    };

    const prospectiveTickets = [...tickets, newTicket];
    const newTotal = prospectiveTickets.reduce((s, t) => s + t.timeSpend, 0);
    if (newTotal > 8) {
      setHoursError(
        'Total hours per day cannot exceed 8.0 hrs. Please adjust your entries.'
      );
      return; // do not add
    }
    setTickets(prospectiveTickets);
    setCurrentTicket({
      id: '',
      typeOfWork: 'Create',
      description: '',
      timeSpend: 0.5,
      ticketId: currentTicket.ticketId, // Keep the Ticket ID
    });
  };

  const handleRemoveTicket = (id: string) => {
    setTickets(tickets.filter(ticket => ticket.id !== id));
  };

  const handleEditTicket = (
    id: string,
    field: keyof Ticket,
    value: string | number
  ) => {
    setHoursError('');
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === id) {
        const updated = { ...ticket, [field]: value };
        return updated;
      }
      return ticket;
    });

    // Validate the updated ticket
    const updatedTicket = updatedTickets.find(t => t.id === id);
    if (updatedTicket) {
      try {
        TicketSchema.parse(updatedTicket);
        // Check total hours
        const newTotal = updatedTickets.reduce((s, t) => s + t.timeSpend, 0);
        if (newTotal > 8) {
          setHoursError(
            'Total hours per day cannot exceed 8.0 hrs. Please adjust your entries.'
          );
          return;
        }
        setTickets(updatedTickets);
      } catch (e) {
        // Show validation error as toast
        const errors = zodToFieldErrors(e);
        const errorMessage = Object.values(errors)[0] || 'Invalid value';
        toast.error(errorMessage);
      }
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate first step inputs using Zod
    const safeUser = sanitizeAccount(username);
    const safeToken = sanitizeToken(token);

    try {
      Step1Schema.parse({ username: safeUser, token: safeToken });
      setUsername(safeUser);
      setToken(safeToken);
      setFieldErrors(prev => {
        const next = { ...prev } as Record<string, string>;
        delete next.username;
        delete next.token;
        return next;
      });
      setStep(2);
    } catch (e) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(e) }));
    }
  };

  // no-op back handler removed in this flow version

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setIsSubmitting(true);

    try {
      const safeDates = sanitizeDates(dates);
      const sanitizedTickets = tickets.map(t => ({
        id: t.id,
        typeOfWork: t.typeOfWork,
        description: sanitizeDescription(t.description),
        timeSpend: sanitizeHours(t.timeSpend),
        ticketId: sanitizeTicketId(t.ticketId),
      }));

      const payload = {
        username: sanitizeAccount(username),
        token: sanitizeToken(token),
        dates: safeDates,
        tickets: sanitizedTickets,
        jiraInstance,
      };

      SubmitPayloadSchema.parse(payload);

      // Create job with async processing
      const jobResponse = await createTimesheetJob({
        username: payload.username.trim(),
        token: payload.token,
        dates: payload.dates,
        jiraInstance: payload.jiraInstance,
        tickets: payload.tickets.map(t => ({
          typeOfWork: t.typeOfWork,
          description: t.description.trim(),
          timeSpend: t.timeSpend,
          ticketId: t.ticketId.trim(),
        })),
      });

      // Initialize job tracking
      setJobId(jobResponse.jobId);
      setJobTotal(jobResponse.total);
      setJobProcessed(0);
      setJobFailed(0);
      setJobProgress(0);
      setJobStatus('in-progress');

      toast.success('Job created! Processing your timesheets...');
    } catch (err) {
      setFieldErrors(prev => ({ ...prev, ...zodToFieldErrors(err) }));
      const message = err instanceof Error ? err.message : 'Submission failed.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalHours = useMemo(
    () => tickets.reduce((sum, t) => sum + t.timeSpend, 0),
    [tickets]
  );

  return (
    <Card className='max-w-4xl mx-auto mt-4'>
      <CardHeader>
        <Tabs value={step.toString()} className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='1'>
              <UserRoundCog className='mr-2 h-4 w-4' /> Setup
            </TabsTrigger>
            <TabsTrigger value='2'>
              <Tags className='mr-2 h-4 w-4' /> Log Ticket
            </TabsTrigger>
            <TabsTrigger value='3'>
              <CheckCircle className='mr-2 h-4 w-4' /> Review
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {/* Flow 1: Setup */}
        {step === 1 && (
          <form onSubmit={handleNext} className='space-y-6'>
            <InputField
              label='FPT account'
              value={username}
              placeholder='Insert your FPT account (E.g., ThaoLNP5)'
              error={fieldErrors.username}
              onChange={e => {
                setUsername(sanitizeAccount(e.target.value));
                if (fieldErrors.username) {
                  setFieldErrors(prev => {
                    const next = { ...prev } as Record<string, string>;
                    delete next.username;
                    return next;
                  });
                }
              }}
              required
            />
            <div className='space-y-1'>
              <InputField
                label='Jira Token'
                helpText={
                  <>
                    Click{' '}
                    <a
                      className='underline text-blue-600'
                      href={`https://insight.fsoft.com.vn/${jiraInstance}/secure/ViewProfile.jspa`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      here
                    </a>
                    , → Then Click on Personal Access Tokens → Create Token
                  </>
                }
                type='password'
                placeholder='Insert your jira token'
                value={token}
                error={fieldErrors.token}
                onChange={e => {
                  setToken(sanitizeToken(e.target.value));
                  if (fieldErrors.token) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.token;
                      return next;
                    });
                  }
                }}
                required
                className='-mt-1'
              />
            </div>
            <FormFooter align='between'>
              <SelectField
                label='Jira System'
                value={jiraInstance}
                onChange={v =>
                  setJiraInstance(v as 'jira9' | 'jiradc' | 'jira3')
                }
                options={[
                  { value: 'jira9', label: 'jira9' },
                  { value: 'jiradc', label: 'jiradc' },
                  { value: 'jira3', label: 'jira3' },
                ]}
                className='w-[180px]'
              />
              <Button type='submit'>
                Next
                <ChevronRight />
              </Button>
            </FormFooter>
          </form>
        )}

        {/* Flow 2: Log Ticket (entry) */}
        {step === 2 && (
          <div className='space-y-6'>
            <TextAreaField
              label='Your Worklog Dates'
              value={dates}
              placeholder='E.g., 20/Aug/25, 21/Aug/25, 22/Aug/25, 25/Aug/25'
              error={fieldErrors.dates}
              rows={3}
              onChange={e => {
                setDates(sanitizeDates(e.target.value));
                if (fieldErrors.dates) {
                  setFieldErrors(prev => {
                    const next = { ...prev } as Record<string, string>;
                    delete next.dates;
                    return next;
                  });
                }
              }}
              helpText={
                <ol className='text-sm text-muted-foreground pl-4 list-decimal space-y-1'>
                  <li>Click on your Jira Project → Project worklog</li>
                  <li>
                    Fill in your account name and the date range, then search
                    your missing work log dates
                  </li>
                  <li>Copy your missing work log dates</li>
                </ol>
              }
              required
            />
            <div className='grid gap-4 md:grid-cols-2'>
              <InputField
                label='Ticket ID'
                value={currentTicket.ticketId}
                placeholder='Enter Jira Ticket (E.g., C99KBBATC2025-37)'
                error={fieldErrors.ticketId}
                onChange={e => {
                  setCurrentTicket({
                    ...currentTicket,
                    ticketId: sanitizeTicketId(e.target.value),
                  });
                  if (fieldErrors.ticketId) {
                    setFieldErrors(prev => {
                      const next = { ...prev } as Record<string, string>;
                      delete next.ticketId;
                      return next;
                    });
                  }
                }}
                required
              />
              <div className='grid grid-cols-2 gap-4'>
                <SelectField
                  label='Type of work'
                  value={currentTicket.typeOfWork}
                  onChange={v => {
                    setCurrentTicket({
                      ...currentTicket,
                      typeOfWork: v as Ticket['typeOfWork'],
                    });
                    if (fieldErrors.typeOfWork) {
                      setFieldErrors(prev => {
                        const next = { ...prev } as Record<string, string>;
                        delete next.typeOfWork;
                        return next;
                      });
                    }
                  }}
                  options={TYPE_OF_WORK_OPTIONS}
                  error={fieldErrors.typeOfWork}
                  placeholder='Select 1 item'
                  required
                />
                <InputField
                  label='Time Spent (hrs)'
                  type='number'
                  value={String(currentTicket.timeSpend || 0.5)}
                  placeholder='0.5'
                  error={fieldErrors.timeSpend}
                  onChange={e => {
                    const value = e.target.value;
                    // Allow empty string for deletion
                    if (value === '') {
                      setCurrentTicket({
                        ...currentTicket,
                        timeSpend: 0.5,
                      });
                    } else {
                      const sanitized = sanitizeHours(value);
                      if (
                        sanitized !== null &&
                        sanitized !== undefined &&
                        !isNaN(sanitized)
                      ) {
                        setCurrentTicket({
                          ...currentTicket,
                          timeSpend: sanitized,
                        });
                      }
                    }
                    if (fieldErrors.timeSpend) {
                      setFieldErrors(prev => {
                        const next = { ...prev } as Record<string, string>;
                        delete next.timeSpend;
                        return next;
                      });
                    }
                  }}
                  required
                />
              </div>
            </div>
            <TextAreaField
              textareaClassName='min-h-24'
              label='Description'
              value={currentTicket.description}
              placeholder="Copy Jira Ticket's description (E.g., Create project plan, do project report...)"
              error={fieldErrors.description}
              rows={6}
              onChange={e => {
                setCurrentTicket({
                  ...currentTicket,
                  description: sanitizeDescription(e.target.value),
                });
                if (fieldErrors.description) {
                  setFieldErrors(prev => {
                    const next = { ...prev } as Record<string, string>;
                    delete next.description;
                    return next;
                  });
                }
              }}
              required
            />
            <div className='flex justify-center'>
              <Button
                aria-label='Add ticket'
                variant='outline'
                onClick={handleAddTicket}
              >
                <Plus />
                Add ticket
              </Button>
            </div>
            {tickets.length === 0 && (
              <div className='flex justify-end'>
                <Button variant='outline' onClick={() => setStep(1)}>
                  <ChevronLeft />
                  Back
                </Button>
              </div>
            )}

            {/* Added list, and ability to go to review (flow 2b similar to image 3) */}
            {tickets.length > 0 && (
              <div className='space-y-4'>
                <Separator />
                <div>
                  <h3 className='font-semibold mb-3'>
                    Added ticket ({tickets.length})
                  </h3>
                  <TicketTable
                    tickets={tickets}
                    onRemoveTicket={handleRemoveTicket}
                    onEditTicket={handleEditTicket}
                    workTypeMeta={workTypeMeta}
                    typeOfWorkOptions={TYPE_OF_WORK_OPTIONS}
                    showActions={true}
                    allowEdit={true}
                  />
                </div>
                <FormFooter align='between'>
                  <div className='text-sm text-muted-foreground'>
                    {tickets.length} tickets . Total {totalHours.toFixed(2)}{' '}
                    hrs/day
                    {hoursError && (
                      <span className='ml-2 text-destructive font-medium'>
                        {hoursError}
                      </span>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button variant='outline' onClick={() => setStep(1)}>
                      <ChevronLeft />
                      Back
                    </Button>
                    <Button
                      disabled={!!hoursError}
                      onClick={() => {
                        const safe = sanitizeDates(dates);
                        setDates(safe);
                        try {
                          DatesSchema.parse(safe);
                          setFieldErrors(prev => {
                            const next = { ...prev } as Record<string, string>;
                            delete next.dates;
                            return next;
                          });
                          setStep(3);
                        } catch (e) {
                          setFieldErrors(prev => ({
                            ...prev,
                            ...zodToFieldErrors(e, 'dates'),
                          }));
                        }
                      }}
                    >
                      Review
                      <CheckCircle />
                    </Button>
                  </div>
                </FormFooter>
              </div>
            )}
          </div>
        )}

        {/* Flow 3: Review (and submit) */}
        {step === 3 && (
          <div className='space-y-6'>
            {/* Show progress bar if job is in progress */}
            {jobStatus === 'in-progress' && jobId && (
              <ProgressBar
                progress={jobProgress}
                processed={jobProcessed}
                total={jobTotal}
                failed={jobFailed}
                status={jobStatus}
              />
            )}

            <div className='space-y-2'>
              <Label className='text-sm font-semibold'>FPT Account</Label>
              <div className='rounded-lg border bg-card p-3'>
                <p className='text-sm font-medium flex items-center gap-2'>
                  <UserRoundCog className='h-4 w-4 text-muted-foreground' />
                  {username}
                </p>
              </div>
            </div>
            <TextAreaField
              label={`Your Worklog Dates (${dates.split(',').filter(Boolean).length || 0})`}
              value={dates}
              rows={3}
              disabled={true}
              onChange={() => {}}
            />
            <div>
              <TicketTable
                tickets={tickets}
                onRemoveTicket={handleRemoveTicket}
                workTypeMeta={workTypeMeta}
                showActions={true}
              />
              <FormFooter align='between' className='mt-4'>
                <div className='text-sm text-muted-foreground'>
                  {tickets.length} tickets . Total {totalHours.toFixed(2)}{' '}
                  hrs/day
                  {hoursError && (
                    <span className='ml-2 text-destructive font-medium'>
                      {hoursError}
                    </span>
                  )}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setStep(2)}
                    disabled={jobStatus === 'in-progress'}
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                  <SubmitButton
                    label='Submit'
                    isLoading={isSubmitting || jobStatus === 'in-progress'}
                    disabled={tickets.length === 0}
                    onClick={() => handleSubmit()}
                  />
                </div>
              </FormFooter>
            </div>
          </div>
        )}

        {/* Success screen */}
        {step === 4 && (
          <div className='flex flex-col items-center justify-center py-16'>
            <CircleCheckBig className='w-24 h-24' />
            <br />
            <p className='text-lg font-medium'>Summary</p>
            {jobTotal > 0 && (
              <div className='mt-4 text-center space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  Processed {jobProcessed} out of {jobTotal} tasks
                </p>
                {jobFailed > 0 && (
                  <p className='text-sm text-red-600 font-medium'>
                    {jobFailed} tasks failed. Please check and retry if needed.
                  </p>
                )}
              </div>
            )}

            {/* Error table when job failed */}
            {jobStatus === 'failed' && jobErrors.length > 0 && (
              <div className='mt-6 w-full max-w-3xl'>
                <h3 className='font-semibold text-lg mb-3 text-destructive'>
                  Failed Tasks ({jobErrors.length})
                </h3>
                <div className='border border-red-200 dark:border-red-800 rounded-lg overflow-hidden'>
                  <Table>
                    <TableHeader className='bg-red-50 dark:bg-red-950'>
                      <TableRow>
                        <TableHead className='font-semibold'>Date</TableHead>
                        <TableHead className='font-semibold'>
                          Ticket ID
                        </TableHead>
                        <TableHead className='font-semibold'>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobErrors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell className='font-medium'>
                            {err.date}
                          </TableCell>
                          <TableCell className='font-medium'>
                            {err.ticketId}
                          </TableCell>
                          <TableCell className='text-red-600 dark:text-red-400'>
                            {err.error}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className='mt-6'>
              <Button
                onClick={() => {
                  // Keep username, token, and tickets for convenience
                  // Only clear dates and job status
                  setDates('');
                  setJobId(null);
                  setJobProgress(0);
                  setJobTotal(0);
                  setJobProcessed(0);
                  setJobFailed(0);
                  setJobStatus(null);
                  setJobErrors([]);
                  setStep(2); // Go directly to step 2 since we have username/token
                }}
              >
                <CirclePlus />
                Add more
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Form;
