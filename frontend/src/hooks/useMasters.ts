import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mastersService } from "../services/mastersService";
import type { MasterEntityId, MasterPayload, MasterResource } from "../services/mastersService";
import type { MasterCatalogs, MasterRecord } from "../domain/types/masters";

type MasterMutationBase = {
  resource: MasterResource;
  skipInvalidate?: boolean;
};

type CreateMasterVariables = MasterMutationBase & {
  payload: MasterPayload;
};

type UpdateMasterVariables = MasterMutationBase & {
  id: MasterEntityId;
  payload: MasterPayload;
};

type RemoveMasterVariables = MasterMutationBase & {
  id: MasterEntityId;
};

// ============================================
// QUERY
// ============================================
export function useMasterCatalogs(options = {}) {
  return useQuery<MasterCatalogs>({
    queryKey: ["master-catalogs"],
    queryFn: mastersService.catalogs,
    staleTime: Infinity,
    gcTime: 900_000,
    ...options,
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
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
  return useMutation<MasterRecord, Error, CreateMasterVariables>({
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
  return useMutation<MasterRecord, Error, UpdateMasterVariables>({
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
  return useMutation<MasterRecord, Error, RemoveMasterVariables>({
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
