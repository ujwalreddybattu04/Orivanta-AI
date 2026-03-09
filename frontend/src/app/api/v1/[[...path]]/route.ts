import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APT_URL || 'http://localhost:8000';
    // Remove trailing slash if present
    backendUrl = backendUrl.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/v1/${path}`;

    console.log(`[proxy] Proxying POST to: ${targetUrl}`);

    try {
        const body = await request.json();

        console.log(`[proxy] Target URL: ${targetUrl}`);
        if (backendUrl.includes('localhost')) {
            console.warn(`[proxy] WARNING: Backend URL is defaulting to localhost. This will likely fail on GCP.`);
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            // Add a timeout to prevent hanging
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[proxy] Backend returned error ${response.status}: ${errorText}`);
            return new Response(JSON.stringify({
                message: errorText || "Backend Error",
                status: response.status,
                url: targetUrl
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // For streaming responses, we need to pass the stream through
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            return new Response(response.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(`[proxy] Proxy failed: ${error.message}`);
        const isLocalhost = targetUrl.includes('localhost');
        const tip = isLocalhost ? "The frontend is trying to talk to 'localhost'. Please set NEXT_PUBLIC_API_URL in GCP Cloud Run." : "Check if your Backend URL is correct and active.";

        return new Response(JSON.stringify({
            message: `${error.message}. TIP: ${tip} (Target: ${targetUrl})`,
            target: targetUrl
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle other methods if needed
export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APT_URL || 'http://localhost:8000';
    // Remove trailing slash if present
    backendUrl = backendUrl.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/v1/${path}`;

    console.log(`[proxy] Proxying GET to: ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
            return new Response(await response.text(), { status: response.status });
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message, target: targetUrl }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
