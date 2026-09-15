type SupabaseErrorLike = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
};

function asSupabaseError(error: unknown): SupabaseErrorLike | null {
  return typeof error === 'object' && error !== null
    ? (error as SupabaseErrorLike)
    : null;
}

export function isMissingSupabaseRelation(error: unknown): boolean {
  return asSupabaseError(error)?.code === 'PGRST205';
}

export function describeSupabaseError(error: unknown): {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
} {
  const supabaseError = asSupabaseError(error);
  if (!supabaseError) {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  const text = (value: unknown) =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

  return {
    code: text(supabaseError.code),
    message: text(supabaseError.message) ?? 'Unknown Supabase error',
    details: text(supabaseError.details),
    hint: text(supabaseError.hint),
  };
}
