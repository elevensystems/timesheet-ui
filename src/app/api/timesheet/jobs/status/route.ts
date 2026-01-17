import { NextRequest, NextResponse } from 'next/server';

import axios from 'axios';

const API_ENDPOINT = process.env.API_URL;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Call external API
    const response = await axios.get(
      `${API_ENDPOINT}/jobs/status?jobId=${encodeURIComponent(jobId)}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        {
          message:
            error.response?.data?.message ||
            'Error fetching job status. Please try again.',
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
