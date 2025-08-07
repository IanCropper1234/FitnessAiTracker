import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// Memory-optimized search hook for large datasets
export interface UseOptimizedSearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFn?: (item: T) => boolean;
  pageSize?: number;
  debounceMs?: number;
  maxCacheSize?: number;
  enableCache?: boolean;
}

interface SearchResult<T> {
  filteredData: T[];
  paginatedData: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isSearching: boolean;
  hasMore: boolean;
}

interface CacheEntry<T> {
  results: T[];
  timestamp: number;
  accessCount: number;
}

// LRU Cache for search results
class SearchCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 50, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: string): T[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    entry.accessCount++;
    entry.timestamp = Date.now();
    return entry.results;
  }

  set(key: string, results: T[]): void {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      let lruKey: string | null = null;
      let lruTimestamp = Date.now();

      Array.from(this.cache.entries()).forEach(([k, v]) => {
        if (v.timestamp < lruTimestamp) {
          lruTimestamp = v.timestamp;
          lruKey = k;
        }
      });

      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      results: results.slice(), // Shallow copy to prevent mutations
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export function useOptimizedSearch<T>({
  data,
  searchFields,
  filterFn,
  pageSize = 20,
  debounceMs = 300,
  maxCacheSize = 50,
  enableCache = true
}: UseOptimizedSearchOptions<T>): [
  SearchResult<T>,
  {
    setSearchTerm: (term: string) => void;
    setCurrentPage: (page: number) => void;
    clearSearch: () => void;
    loadMore: () => void;
    getCacheStats: () => { size: number; maxSize: number };
  }
] {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Cache instance - persists across re-renders
  const cacheRef = useRef<SearchCache<T>>();
  if (!cacheRef.current) {
    cacheRef.current = new SearchCache<T>(maxCacheSize);
  }

  // Debounce search term
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // Memory-efficient search function
  const performSearch = useCallback((
    items: T[],
    term: string,
    fields: (keyof T)[]
  ): T[] => {
    if (!term.trim()) return items;

    const searchTermLower = term.toLowerCase();
    const results: T[] = [];

    // Use for loop instead of filter for better memory performance
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let matches = false;

      // Check if any search field matches
      for (let j = 0; j < fields.length; j++) {
        const fieldValue = item[fields[j]];
        if (fieldValue != null) {
          const stringValue = String(fieldValue).toLowerCase();
          if (stringValue.includes(searchTermLower)) {
            matches = true;
            break;
          }
        }
      }

      if (matches) {
        results.push(item);
      }
    }

    return results;
  }, []);

  // Filtered data with caching
  const filteredData = useMemo(() => {
    const cacheKey = `${debouncedSearchTerm}:${JSON.stringify(filterFn?.toString() || '')}:${data.length}`;
    
    // Try to get from cache first
    if (enableCache && cacheRef.current) {
      const cachedResults = cacheRef.current.get(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
    }

    // Apply custom filter first if provided
    const baseData = filterFn ? data.filter(filterFn) : data;

    // Perform search
    const searchResults = performSearch(baseData, debouncedSearchTerm, searchFields);

    // Cache results
    if (enableCache && cacheRef.current) {
      cacheRef.current.set(cacheKey, searchResults);
    }

    return searchResults;
  }, [data, debouncedSearchTerm, searchFields, filterFn, performSearch, enableCache]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  // Computed values
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasMore = currentPage < totalPages;

  // Control functions
  const setSearchTermHandler = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const setCurrentPageHandler = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
    if (cacheRef.current) {
      cacheRef.current.clear();
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const getCacheStats = useCallback(() => ({
    size: cacheRef.current?.size() || 0,
    maxSize: maxCacheSize
  }), [maxCacheSize]);

  return [
    {
      filteredData,
      paginatedData,
      totalItems,
      totalPages,
      currentPage,
      isSearching,
      hasMore
    },
    {
      setSearchTerm: setSearchTermHandler,
      setCurrentPage: setCurrentPageHandler,
      clearSearch,
      loadMore,
      getCacheStats
    }
  ];
}

// Hook for virtual scrolling with large datasets
export function useVirtualizedList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const itemsPerPage = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + itemsPerPage + 1, items.length);
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    handleScroll,
    scrollTop
  };
}