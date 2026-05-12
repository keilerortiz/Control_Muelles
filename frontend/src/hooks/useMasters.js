import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mastersService } from "../services/mastersService";

// ============================================
// QUERY
// ============================================
export function useMasterCatalogs(options = {}) {
  return useQuery({
    queryKey: ["master-catalogs"],
    queryFn: mastersService.catalogs,
    staleTime: 300_000,
    gcTime: 900_000,
    ...options,
  });
}

// ============================================
// MUTATIONS (individuales)
// ============================================
export function useInvalidateMasterCatalogs() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["master-catalogs"] });
}

export function useCreateMaster() {
  const invalidate = useInvalidateMasterCatalogs();
  return useMutation({
    mutationFn: ({ resource, payload }) => mastersService.create(resource, payload),
    onSuccess: (_data, variables) => {
      if (variables?.skipInvalidate) {
        return;
      }
      invalidate();
    },
  });
}

export function useUpdateMaster() {
  const invalidate = useInvalidateMasterCatalogs();
  return useMutation({
    mutationFn: ({ resource, id, payload }) => mastersService.update(resource, id, payload),
    onSuccess: (_data, variables) => {
      if (variables?.skipInvalidate) {
        return;
      }
      invalidate();
    },
  });
}

export function useRemoveMaster() {
  const invalidate = useInvalidateMasterCatalogs();
  return useMutation({
    mutationFn: ({ resource, id }) => mastersService.remove(resource, id),
    onSuccess: (_data, variables) => {
      if (variables?.skipInvalidate) {
        return;
      }
      invalidate();
    },
  });
}

export function useMasterMutations() {
  const create = useCreateMaster();
  const update = useUpdateMaster();
  const remove = useRemoveMaster();

  return { create, update, remove };
}
