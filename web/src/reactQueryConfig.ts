import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export default queryClient;