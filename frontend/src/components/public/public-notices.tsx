import { formatPublicDate, type PublicNotice } from "@/lib/public-org";

type PublicNoticesListProps = {
  notices: PublicNotice[];
};

export function PublicNoticesList({ notices }: PublicNoticesListProps) {
  if (notices.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">Sin avisos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando la organización publique avisos, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notices.map((notice) => (
        <li
          key={notice.id}
          className="border border-border bg-card px-4 py-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {notice.title}
              {notice.featured ? (
                <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[0.6875rem] font-medium text-foreground">
                  Destacado
                </span>
              ) : null}
            </h2>
            <time className="text-xs text-muted-foreground">
              {formatPublicDate(notice.published_at)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {notice.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
