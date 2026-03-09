import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    const backendUrl = 'https://orivanta-87056410261.europe-west1.run.app'.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/v1/${path}`;

    console.log(`[proxy] Proxying POST to: ${targetUrl}`);

    try {
        const body = await request.json();

        console.log(`[proxy] Target URL: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
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

        return new Response(JSON.stringify({
            message: `${error.message} (Target: ${targetUrl})`,
            target: targetUrl
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    const backendUrl = 'https://orivanta-87056410261.europe-west1.run.app'.replace(/\/$/, "");
    const targetUrl = `${backendUrl}/api/v1/${path}`;

    console.log(`[proxy] Proxying GET to: ${targetUrl}`);

    try {
        const response = await fetch(targetUrl, { signal: AbortSignal.timeout(60000) });
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