import { NextRequest, NextResponse } from 'next/server'

// Proxy API route to handle CORS issues by forwarding requests from the client
// to the backend API server-side

function getApiBaseUrl(pathSegments: string[]): string {
  // Check if this is an admin API request (path starts with "Admin")
  const isAdminApi = pathSegments[0] === 'Admin'
  
  // Get the appropriate API base URL from environment variable
  const apiBase = isAdminApi 
    ? (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'usermanagementapi.poultrycore.com')
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'farmapi.techretainer.com')
  
  // Ensure it has https:// prefix if not already present
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase
  }
  return `https://${apiBase}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return handleRequest(request, path, 'PATCH')
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const apiBaseUrl = getApiBaseUrl(pathSegments)
    const path = pathSegments.join('/')
    
    // Get the full URL with query parameters
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ''
    const targetUrl = `${apiBaseUrl}/api/${path}${queryString}`

    // Get headers from the incoming request (except host, which we'll replace)
    const headers = new Headers()
    request.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const body = await request.text()
      if (body) {
        fetchOptions.body = body
        // Log request body for debugging (limit to first 2000 chars to avoid huge logs)
        try {
          const bodyPreview = body.length > 2000 ? body.substring(0, 2000) + '...' : body
          console.log('[Proxy API] Request body:', bodyPreview)
          // Try to parse and log as JSON for better readability
          try {
            const bodyJson = JSON.parse(body)
            console.log('[Proxy API] Request body (parsed):', JSON.stringify(bodyJson, null, 2))
          } catch {
            // Not JSON, log as-is
          }
        } catch (e) {
          console.log('[Proxy API] Could not log request body:', e)
        }
      } else {
        console.log('[Proxy API] No request body found')
      }
    }

    // Forward the request to the backend API
    const isAdminApi = pathSegments[0] === 'Admin'
    console.log(`[Proxy API] ${isAdminApi ? 'Admin' : 'Main'} API - Forwarding ${method} request to:`, targetUrl)
    console.log('[Proxy API] Request headers:', Object.fromEntries(headers.entries()))
    
    const response = await fetch(targetUrl, fetchOptions)
    
    console.log('[Proxy API] Response status:', response.status, response.statusText)
    console.log('[Proxy API] Response headers:', Object.fromEntries(response.headers.entries()))

    // Handle 204 No Content - no body to read
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        statusText: response.statusText,
      })
    }

    // Get response body for other status codes
    const contentType = response.headers.get('content-type') || ''
    let body: any
    
    try {
      // Try to read response as text first (safer than assuming JSON)
      const textBody = await response.text()
      
      if (textBody && textBody.trim()) {
        // We have a body, parse it appropriately
        if (contentType.includes('application/json') || contentType.includes('text/json')) {
          try {
            body = JSON.parse(textBody)
          } catch (e) {
            // If JSON parsing fails, use the text
            console.warn('[Proxy API] Failed to parse JSON, using text:', e)
            body = { message: textBody, raw: textBody }
          }
        } else {
          // Try to parse as JSON if it looks like JSON
          if (textBody.trim().startsWith('{') || textBody.trim().startsWith('[')) {
            try {
              body = JSON.parse(textBody)
            } catch {
              body = { message: textBody, raw: textBody }
            }
          } else {
            body = { message: textBody, raw: textBody }
          }
        }
      } else {
        // Empty body - return empty object
        body = {}
      }
      
      // Log error responses for debugging
      if (response.status >= 400) {
        console.error('[Proxy API] Error response body:', body)
      }
    } catch (error) {
      console.error('[Proxy API] Error reading response body:', error)
      body = { error: 'Failed to read response body', details: error instanceof Error ? error.message : String(error) }
    }

    // Always return JSON response to maintain consistency
    const nextResponse = NextResponse.json(body, {
      status: response.status,
      statusText: response.statusText,
    })

    // Copy relevant response headers
    response.headers.forEach((value, key) => {
      // Forward CORS and other relevant headers
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value)
      }
    })

    return nextResponse
  } catch (error: any) {
    console.error('[Proxy API] Error forwarding request:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'Failed to forward request to backend API' 
      },
      { status: 500 }
    )
  }
}

