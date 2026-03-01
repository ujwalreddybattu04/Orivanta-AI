// useSearch — hook for search functionality
export function useSearch() {
    // TODO: Implement search with streaming
    return {
        query: "",
        setQuery: (_q: string) => { },
        results: null,
        isLoading: false,
        error: null,
        search: async (_query: string) => { },
    };
}
