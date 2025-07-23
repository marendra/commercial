
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env as privateEnv } from '$env/dynamic/private';
// Import the PRIVATE environment variable


const EXTERNAL_API_URL = 'https://exportpdftojson-swufcdx2cq-et.a.run.app';

export const POST: RequestHandler = async ({ request }) => {

	const CONVERSION_API_KEY = request?.env?.CONVERSION_API_KEY||privateEnv.CONVERSION_API_KEY;

	try {
    // 1. Get the data from the client's request
    const body = await request.json();
    const fileName = body.fileName;

    if (!fileName || !Array.isArray(fileName) || fileName.length === 0) {
      return json({ message: 'Bad Request: fileName is required.' }, { status: 400 });
    }

    // 2. Call the external API from your server, securely adding the API key
    const apiResponse = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONVERSION_API_KEY
      },
      body: JSON.stringify({ fileName: fileName })
    });

    // 3. Handle the response from the external API
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      // Forward the error from the external API to the client
      return json({ message: `External API Error: ${errorText}` }, { status: apiResponse.status });
    }

    const responseData = await apiResponse.json();

    // 4. Send the successful response back to the client
    return json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('Proxy endpoint error:', error);
    return json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
};