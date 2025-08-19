import React from 'react';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { fetchUrlData, UrlFetchError } from '../../utils/urlFetcher';

interface JsonViewerProps {
  data: any;
  level?: number;
}

function JsonViewer({ data, level = 0 }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const indent = React.useMemo(() => "  ".repeat(level), [level]);

  if (typeof data !== 'object' || data === null) {
    return (
      <span className={`${
        typeof data === 'string' ? 'text-green-600' : 
        typeof data === 'number' ? 'text-blue-600' : 
        'text-red-600'
      }`}>
        {JSON.stringify(data)}
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span>[]</span>;
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-100 rounded p-1"
        >
          <ChevronRight 
            className={`w-4 h-4 inline-block transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} 
          />
          Array[{data.length}]
        </button>
        {isExpanded && (
          <div className="ml-4">
            {data.map((item, index) => (
              <div key={index}>
                {indent}<span className="text-gray-500">{index}: </span>
                <JsonViewer data={item} level={level + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const entries = Object.entries(data);
  if (entries.length === 0) return <span>{"{}"}</span>;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-gray-100 rounded p-1"
      >
        <ChevronRight 
          className={`w-4 h-4 inline-block transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} 
        />
        Object{"{"}keys: {entries.length}{"}"}
      </button>
      {isExpanded && (
        <div className="ml-4">
          {entries.map(([key, value]) => (
            <div key={key}>
              {indent}<span className="text-purple-600">"{key}"</span>: <JsonViewer data={value} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ApiDataViewerProps {
  url: string | null;
}

export function ApiDataViewer({ url }: ApiDataViewerProps) {
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) return;

    const abortController = new AbortController();
    
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchUrlData(url, {
          fetchOptions: {
            signal: abortController.signal
          }
        });
        
        setData(data);
      } catch (err) {
        if (err instanceof UrlFetchError) {
          setError(err.message);
        } else if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // Ignore abort errors
            return;
          }
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [url]);

  if (!url) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-center text-yellow-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          No URL provided
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center text-red-800">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center text-gray-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">API URL:</div>
        <div className="text-sm font-mono break-all text-gray-600">
          {url}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <JsonViewer data={data} />
      </div>
    </div>
  );
}