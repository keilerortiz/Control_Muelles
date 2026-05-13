import { z } from "zod";

const apiEnvelopeSchema = z.object({
  data: z.unknown(),
});

export function parseApiData<T>(input: unknown, schema: z.ZodType<T>, context: string): T {
  const envelopeResult = apiEnvelopeSchema.safeParse(input);
  if (!envelopeResult.success) {
    throw new Error(`Respuesta API inválida en ${context}: falta el campo data.`);
  }

  const payloadResult = schema.safeParse(envelopeResult.data.data);
  if (!payloadResult.success) {
    throw new Error(`Payload API inválido en ${context}.`);
  }

  return payloadResult.data;
}

export function parseApiDataArray<T>(input: unknown, itemSchema: z.ZodType<T>, context: string): T[] {
  return parseApiData(input, z.array(itemSchema), context);
}
