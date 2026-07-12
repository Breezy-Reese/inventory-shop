import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

export function useApiQuery<T>(
  key: QueryKey,
  path: string,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">,
) {
  return useQuery<T, ApiError>({
    queryKey: key,
    queryFn: () => api<T>(path),
    retry: false,
    ...options,
  });
}

interface MutationConfig {
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  invalidate?: QueryKey[];
  successMessage?: string;
  onSuccess?: () => void;
}

export function useApiMutation<TInput = unknown, TOutput = unknown>(
  pathFn: string | ((input: TInput) => string),
  config: MutationConfig = {},
) {
  const queryClient = useQueryClient();
  const { method = "POST", invalidate = [], successMessage, onSuccess } = config;

  return useMutation<TOutput, ApiError, TInput>({
    mutationFn: (input: TInput) => {
      const path = typeof pathFn === "function" ? pathFn(input) : pathFn;
      return api<TOutput>(path, {
        method,
        body: method === "DELETE" ? undefined : JSON.stringify(input),
      });
    },
    onSuccess: () => {
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      if (successMessage) toast.success(successMessage);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
