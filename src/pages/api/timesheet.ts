import { NextApiRequest, NextApiResponse } from 'next';

// Types
interface Ticket {
  ticketId: string;
  timeSpend: string;
  description: string;
  typeOfWork: string;
}

interface TimesheetRequest {
  username: string;
  dates: string | string[];
  tickets: Ticket[];
  jiraInstance?: 'jira9' | 'jiradc';
}

interface JiraPayload {
  description: string;
  endDate: string;
  issueKey: string;
  period: boolean;
  remainingTime: number;
  startDate: string;
  time: string;
  timeSpend: number;
  typeOfWork: string;
  username: string;
}

const WAIT_BETWEEN_REQUESTS_MS = 1000;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility functions
const parseDates = (dates: string | string[]): string[] => {
  if (Array.isArray(dates)) {
    return dates;
  }
  return [dates];
};

const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
};

const getTimesheetApiUrl = (
  jiraInstance: 'jira9' | 'jiradc' = 'jira9'
): string => {
  const envVar =
    jiraInstance === 'jira9'
      ? 'TIMESHEET_JIRA9_API_URL'
      : 'TIMESHEET_JIRADC_API_URL';

  const apiUrl = process.env[envVar];
  if (!apiUrl) {
    throw new Error(`${envVar} environment variable is not set`);
  }
  return apiUrl;
};

const createJiraHeaders = (token: string): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const sendRequest = async (
  url: string,
  payload: JiraPayload,
  headers: HeadersInit
): Promise<void> => {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request failed with status ${response.status}: ${errorText}`
    );
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res
        .status(400)
        .json({ error: 'Invalid Authorization header format' });
    }

    const body = req.body as TimesheetRequest;
    const { username, dates: rawDates, tickets, jiraInstance = 'jira9' } = body;

    // Validation
    if (!username) {
      return res
        .status(400)
        .json({ error: 'Missing required field: username' });
    }

    if (!rawDates) {
      return res.status(400).json({ error: 'Missing required field: dates' });
    }

    if (!tickets || !Array.isArray(tickets)) {
      return res.status(400).json({
        error: 'Missing or invalid tickets: must provide a tickets array',
      });
    }

    if (tickets.length === 0) {
      return res.status(400).json({
        error: 'Empty tickets array: at least one ticket is required',
      });
    }

    // Validate ticket structure
    const invalidTickets = tickets.filter(
      ticket =>
        !ticket.ticketId ||
        !ticket.timeSpend ||
        !ticket.description ||
        !ticket.typeOfWork
    );

    if (invalidTickets.length > 0) {
      return res.status(400).json({
        error:
          'Invalid ticket format: each ticket must have ticketId, timeSpend, description, and typeOfWork',
      });
    }

    const dates = parseDates(rawDates);
    const apiUrl = getTimesheetApiUrl(jiraInstance);
    const headers = createJiraHeaders(token);

    const totalRequests = dates.length * tickets.length;
    let processed = 0;

    for (const date of dates) {
      for (const ticket of tickets) {
        const currentTime = getCurrentTime();

        const payload: JiraPayload = {
          description: ticket.description,
          endDate: date,
          issueKey: ticket.ticketId,
          period: false,
          remainingTime: 0,
          startDate: date,
          time: ` ${currentTime}`,
          timeSpend: parseInt(ticket.timeSpend) * 3600,
          typeOfWork: ticket.typeOfWork,
          username,
        };

        console.log(
          `Sending request for ${ticket.ticketId} on ${date} at ${currentTime}`
        );

        await sendRequest(apiUrl, payload, headers);

        processed += 1;
        // Wait only if there are more requests to send
        if (processed < totalRequests) {
          await sleep(WAIT_BETWEEN_REQUESTS_MS);
        }
      }
    }

    return res.status(200).json({
      message: 'Timesheet logging process completed successfully.',
      processed: totalRequests,
    });
  } catch (error) {
    console.error('Error processing timesheet:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
