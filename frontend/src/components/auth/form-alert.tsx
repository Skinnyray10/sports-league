type FormAlertProps = {
  id?: string;
  error: string | null;
  notice?: string | null;
};

export function FormAlert({ id, error, notice }: FormAlertProps) {
  if (error) {
    return (
      <p
        id={id}
        role="alert"
        className="rounded-lg border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive"
      >
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p
        id={id}
        role="status"
        className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
      >
        {notice}
      </p>
    );
  }
  return null;
}
