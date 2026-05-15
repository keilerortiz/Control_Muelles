import { z } from "zod";

export const appointmentSchema = z.object({
  Id: z.number(),
  Status: z.string().optional(),
}).passthrough();

export const appointmentStatusLogSchema = z.object({
  Id: z.number().optional(),
  appointmentId: z.number().optional(),
  NewStatus: z.string().optional(),
  ChangedAt: z.string().optional(),
}).passthrough();

export const appointmentCandidatesSchema = z.object({
  version: z.number().optional(),
  docks: z.array(z.record(z.unknown())).optional(),
  operators: z.array(z.record(z.unknown())).optional(),
}).passthrough();

export const appointmentListResponseSchema = z.object({
  items: z.array(appointmentSchema),
  total: z.number(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
}).passthrough();

export const masterRecordSchema = z.object({
  Id: z.union([z.number(), z.string()]).optional(),
  Name: z.string().optional(),
  Email: z.string().optional(),
  IsActive: z.boolean().optional(),
  StandardTimeMinutes: z.number().optional(),
  ToleranceMinutes: z.number().optional(),
  Description: z.string().optional(),
}).passthrough();

export const masterCatalogsSchema = z.object({
  clients: z.array(masterRecordSchema).optional(),
  vehicleTypes: z.array(masterRecordSchema).optional(),
  operationTypes: z.array(masterRecordSchema).optional(),
  standards: z.array(masterRecordSchema).optional(),
  businessRules: z.array(masterRecordSchema).optional(),
  users: z.array(masterRecordSchema).optional(),
  roles: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
}).passthrough();

export const dashboardSummarySchema = z.object({
  total: z.number().optional(),
  activeOperations: z.number().optional(),
  completionRate: z.number().optional(),
  en_patio: z.number().optional(),
  entrega_documentos: z.number().optional(),
  en_proceso: z.number().optional(),
  para_firmar: z.number().optional(),
  retrasada: z.number().optional(),
  operationalState: z.record(z.unknown()).optional(),
  kpis: z.record(z.unknown()).optional(),
  alerts: z.array(
    z.object({
      type: z.string(),
      appointmentId: z.union([z.number(), z.string()]).optional(),
      severity: z.string().optional(),
      message: z.string().optional(),
    }).passthrough(),
  ).optional(),
}).passthrough();

export const dashboardKpisTimelineSchema = z.object({
  timezone: z.string(),
  buckets: z.array(
    z.object({
      label: z.string(),
      hour: z.number(),
      otcRate: z.number().nullable().optional(),
      otsRate: z.number().nullable().optional(),
    }),
  ),
});

export const operatorPerformanceSchema = z.object({
  items: z.array(
    z.object({
      operatorId: z.number(),
      name: z.string(),
      role: z.union([z.literal("Senior"), z.literal("Junior")]),
      executedMinutes: z.number(),
      totalOperations: z.number(),
      compliantOperations: z.number(),
      otsRate: z.number(),
    }),
  ),
});
