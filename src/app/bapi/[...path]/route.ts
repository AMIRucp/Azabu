import { NextRequest, NextResponse } from 'next/server';

const WHITELIST_RESPONSE = {
  code: "000000",
  message: null,
  messageDetail: null,
  data: { sourceCode: "" },
  success: true,
};

async function proxyToAster(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');

  if (pathStr.includes('get-broker-source-code') || pathStr.includes('whitelist')) {
    return NextResponse.json(WHITELIST_RESPONSE);
  }

  const url = new URL(req.url);
  const targetUrl = `https://www.asterdex.com/bapi/${pathStr}${url.search}`;

  try {
    const ALLOWED_HEADERS = ['content-type', 'accept', 'accept-language', 'user-agent'];
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (ALLOWED_HEADERS.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    const data = await res.arrayBuffer();
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('access-control-allow-origin', '*');

    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

export const GET = proxyToAster;
export const POST = proxyToAster;
export const PUT = proxyToAster;
export const DELETE = proxyToAster;
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
    },
  });
};
