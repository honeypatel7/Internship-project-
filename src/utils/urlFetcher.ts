/**
 * Configuration options for fetching URL data
 */
interface FetchOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Additional fetch options to merge */
  fetchOptions?: RequestInit;
}

/**
 * Error types that can occur during URL fetching
 */
export class UrlFetchError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'TIMEOUT' | 'NETWORK' | 'JSON_PARSE' | 'NOT_FOUND',
    public readonly status?: number
  ) {
    super(message);
    this.name = 'UrlFetchError';
  }
}

/**
 * Validates and normalizes a URL string
 * @param url The URL to validate
 * @returns The normalized URL string
 * @throws UrlFetchError if URL is invalid
 */
function validateUrl(url: unknown): string {
  if (!url || typeof url !== 'string') {
    throw new UrlFetchError(
      'Invalid or missing URL',
      'INVALID_URL'
    );
  }

  try {
    return new URL(url).toString();
  } catch {
    throw new UrlFetchError(
      'Invalid URL format',
      'INVALID_URL'
    );
  }
}

/**
 * Fetches and parses JSON data from a URL with timeout and error handling
 * @param urlPath Optional URL or path to URL (e.g. data?.url)
 * @param options Fetch configuration options
 * @returns Parsed JSON data
 * @throws UrlFetchError on various failure conditions
 */
export async function fetchUrlData<T = unknown>(
  urlPath: unknown,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    fetchOptions = {}
  } = options;

  // Validate URL
  const url = validateUrl(urlPath);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new UrlFetchError(
        `HTTP error! status: ${response.status}`,
        response.status === 404 ? 'NOT_FOUND' : 'NETWORK',
        response.status
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new UrlFetchError(
        'Response is not JSON',
        'JSON_PARSE'
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof UrlFetchError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new UrlFetchError(
        'Network error',
        'NETWORK'
      );
    }
    if (error instanceof SyntaxError) {
      throw new UrlFetchError(
        'Invalid JSON response',
        'JSON_PARSE'
      );
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UrlFetchError(
        'Request timeout',
        'TIMEOUT'
      );
    }
    throw new UrlFetchError(
      'Unknown error occurred',
      'NETWORK'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}