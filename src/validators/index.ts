export * from './auth.validator';
export * from './farmer.validator';
export * from './farm.validator';

import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Validates request data against a Zod schema and returns typed output data
 */
export async function validateRequest<TOut, TIn = unknown>(
  schema: z.ZodType<TOut, z.ZodTypeDef, TIn>,
  data: unknown
): Promise<{ success: true; data: TOut } | { success: false; errors: unknown }> {
  const result = await schema.safeParseAsync(data);
  if (!result.success) {
    return { success: false, errors: result.error.format() };
  }
  return { success: true, data: result.data };
}
