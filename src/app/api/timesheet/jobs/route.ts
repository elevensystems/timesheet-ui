import { NextRequest, NextResponse } from 'next/server';

import axios from 'axios';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dates, jiraInstance, username, tickets, token } = body;

    // Validate required fields
    if (!dates || !jiraInstance || !username || !token) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare request body for external API
    const requestBody = {
      dates,
      jiraInstance,
      username,
      tickets: tickets?.map((t: any) => ({
        ticketId: t.ticketId,
        timeSpend: String(t.timeSpend),
        description: t.description,
        typeOfWork: t.typeOfWork,
      })),
    };

    // Call external API
    const response = await axios.post(
      `${API_ENDPOINT}/timesheet/jobs`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message:
            error.response?.data?.message ||
            'Error creating job. Please check your connection and try again.',
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
