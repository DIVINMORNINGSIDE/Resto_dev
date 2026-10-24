// Champs du back-office clair (même structure que les champs de l'espace client).

const inputClass =
  "min-h-11 w-full rounded-xl border border-bo-line bg-bo-card px-3.5 text-base text-bo-text placeholder:text-bo-text2/60 transition-colors focus:border-bo-gold focus:outline-none aria-invalid:border-bo-bad";

type Common = { label: string; name: string; error?: string; hint?: string; id?: string };

function Wrapper({ label, inputId, error, hint, children }: { label: string; inputId: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-bo-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-bo-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-bo-text2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(inputId: string, error?: string, hint?: string) {
  return error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
}

export function BoField({ label, name, error, hint, id, ...input }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? name;
  return (
    <Wrapper label={label} inputId={inputId} error={error} hint={hint}>
      <input
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(inputId, error, hint)}
        className={inputClass}
        {...input}
      />
    </Wrapper>
  );
}

export function BoTextarea({ label, name, error, hint, id, ...input }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? name;
  return (
    <Wrapper label={label} inputId={inputId} error={error} hint={hint}>
      <textarea
        id={inputId}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(inputId, error, hint)}
        className={`${inputClass} py-2.5`}
        {...input}
      />
    </Wrapper>
  );
}

export function BoSelect({
  label,
  name,
  error,
  hint,
  id,
  options,
  ...input
}: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const inputId = id ?? name;
  return (
    <Wrapper label={label} inputId={inputId} error={error} hint={hint}>
      <select
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(inputId, error, hint)}
        className={inputClass}
        {...input}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function BoCheckbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-bo-line bg-bo-card px-3.5 text-sm font-semibold">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-bo-gold" />
      {label}
    </label>
  );
}

export function BoNotice({ message, success }: { message?: string; success?: string }) {
  if (success) {
    return (
      <p role="status" className="rounded-xl bg-bo-okbg px-4 py-3 text-sm font-semibold text-bo-ok animate-rise">
        {success}
      </p>
    );
  }
  if (message) {
    return (
      <p role="alert" className="rounded-xl bg-bo-badbg px-4 py-3 text-sm font-semibold text-bo-bad animate-rise">
        {message}
      </p>
    );
  }
  return null;
}

// flush : sans marge intérieure, pour les listes qui vont jusqu'aux bords.
export function BoCard({ children, className = "", flush = false }: { children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`rounded-2xl border border-bo-line bg-bo-card animate-rise ${flush ? "overflow-hidden" : "p-5"} ${className}`}>
      {children}
    </section>
  );
}

export function BoPageHeader({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div>
        <p className="deco text-bo-gold">{kicker}</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}
