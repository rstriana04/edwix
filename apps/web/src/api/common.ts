import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export function useInvalidateOnSuccess<TVariables>(
  queryKeys: ReadonlyArray<readonly unknown[]>,
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [...key] })));
    },
  });
}
