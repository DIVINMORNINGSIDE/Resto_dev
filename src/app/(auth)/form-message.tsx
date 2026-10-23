export function FormMessage({ message, success }: { message?: string; success?: string }) {
  if (success) {
    return (
      <p role="status" className="rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
        {success}
      </p>
    );
  }
  if (message) {
    return (
      <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-bad">
        {message}
      </p>
    );
  }
  return null;
}
