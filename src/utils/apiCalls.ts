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

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

/**
 * Legacy function - submits timesheet directly
 * @deprecated Use createTimesheetJob instead for better progress tracking
 */
export async function submitTimesheet(
  data: TimesheetData
): Promise<{ success: boolean; message: string; submittedDates?: string[] }> {
  try {
    // Get API URL from environment variable and construct the endpoint
    const apiUrl = `${API_ENDPOINT}/timesheet`;
    const response = await axios.post(apiUrl, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          'Error submitting timesheet. Please check your connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Creates a new timesheet job for async processing
 * @param data Timesheet submission data
 * @returns Job ID and total tasks count
 */
export async function createTimesheetJob(
  data: TimesheetData
): Promise<CreateJobResponse> {
  try {
    const apiUrl = `${API_ENDPOINT}/jobs`;

    // Prepare request body
    const requestBody = {
      dates: data.dates,
      jiraInstance: data.jiraInstance,
      username: data.username,
      tickets: data.tickets?.map(t => ({
        ticketId: t.ticketId,
        timeSpend: String(t.timeSpend), // Send as string to match backend expectations
        description: t.description,
        typeOfWork: t.typeOfWork,
      })),
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          'Error creating job. Please check your connection and try again.'
      );
    }
    throw error;
  }
}

/**
 * Polls job status by jobId
 * @param jobId The job ID to check
 * @returns Current job status with progress
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  try {
    const apiUrl = `${API_ENDPOINT}/jobs/status?jobId=${encodeURIComponent(jobId)}`;
    const response = await axios.get(apiUrl);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          'Error fetching job status. Please try again.'
      );
    }
    throw error;
  }
}
