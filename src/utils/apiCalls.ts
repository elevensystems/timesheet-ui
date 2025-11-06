import axios from 'axios';

interface Ticket {
  id?: string; // For UI tracking only, not needed for API
  typeOfWork: 'Create' | 'Review' | 'Study' | 'Correct' | 'Translate' | 'Test';
  description: string;
  timeSpend: number;
  ticketId: string;
}

interface TimesheetData {
  username: string;
  token: string;
  dates: string;
  jiraInstance: 'jira9' | 'jiradc';
  tickets?: Ticket[];
}

interface JobStatus {
  jobId: string;
  total: number;
  processed: number;
  failed: number;
  status: 'in-progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
  progress: number;
  errors?: Array<{
    ticketId: string;
    date: string;
    error: string;
  }>;
}

interface CreateJobResponse {
  jobId: string;
  total: number;
  message: string;
}

/**
 * Submits timesheet directly using Next.js API route
 */
export async function submitTimesheet(
  data: TimesheetData
): Promise<{ message: string; processed: number }> {
  try {
    // Parse dates string into array
    const datesArray = data.dates
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    // Prepare request body to match API route expectations
    const requestBody = {
      username: data.username,
      dates: datesArray,
      jiraInstance: data.jiraInstance,
      tickets: data.tickets?.map(t => ({
        ticketId: t.ticketId,
        timeSpend: String(t.timeSpend), // API expects string
        description: t.description,
        typeOfWork: t.typeOfWork,
      })),
    };

    const response = await axios.post('/api/timesheet', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error submitting timesheet. Please check your connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Creates a new timesheet job for async processing
 * Uses the Next.js API route which processes requests synchronously with delays
 * @param data Timesheet submission data
 * @returns Simulated job response with total tasks
 */
export async function createTimesheetJob(
  data: TimesheetData
): Promise<CreateJobResponse> {
  try {
    // Call the same submitTimesheet function
    const result = await submitTimesheet(data);

    // Return a simulated job response to maintain compatibility with the form
    return {
      jobId: `job-${Date.now()}`,
      total: result.processed,
      message: result.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error creating job. Please check your connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Simulates job status polling for the Next.js API route
 * Since the API processes synchronously, this returns completed status immediately
 * @param jobId The job ID to check (not used in this implementation)
 * @returns Completed job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  // Since the Next.js API route processes synchronously,
  // we simulate immediate completion
  return {
    jobId,
    total: 0,
    processed: 0,
    failed: 0,
    status: 'completed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    progress: 100,
    errors: [],
  };
}
