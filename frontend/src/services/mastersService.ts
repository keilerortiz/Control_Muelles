import { apiClient } from "./apiClient";
import type { MasterCatalogs, MasterRecord } from "../domain/types/masters";
import { parseApiData } from "../domain/apiValidation";
import { masterCatalogsSchema, masterRecordSchema } from "../schemas/apiSchemas";

export type MasterResource = string;
export type MasterPayload = Record<string, unknown>;
export type MasterEntityId = number | string;

export const mastersService = {
  async catalogs(): Promise<MasterCatalogs> {
    const response = await apiClient.get("/masters/catalogs");
    return parseApiData(response.data, masterCatalogsSchema, "masters.catalogs");
  },

  async create(resource: MasterResource, payload: MasterPayload): Promise<MasterRecord> {
    const response = await apiClient.post(`/masters/${resource}`, payload);
    return parseApiData(response.data, masterRecordSchema, "masters.create");
  },

  async update(resource: MasterResource, id: MasterEntityId, payload: MasterPayload): Promise<MasterRecord> {
    const response = await apiClient.put(`/masters/${resource}/${id}`, payload);
    return parseApiData(response.data, masterRecordSchema, "masters.update");
  },

  async remove(resource: MasterResource, id: MasterEntityId): Promise<MasterRecord> {
    const response = await apiClient.delete(`/masters/${resource}/${id}`);
    return parseApiData(response.data, masterRecordSchema, "masters.remove");
  },
};
