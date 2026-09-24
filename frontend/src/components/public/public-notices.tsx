import { formatPublicDate, type PublicNotice } from "@/lib/public-org";

type PublicNoticesListProps = {
  notices: PublicNotice[];
};

export function PublicNoticesList({ notices }: PublicNoticesListProps) {
  if (notices.length === 0) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">Sin avisos</p>
        <p className="mt-1 text-sm text-[#5C6570]">
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
          className="border border-[#D0D5DB] bg-white px-4 py-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-[#0A0A0A]">
              {notice.title}
              {notice.featured ? (
                <span className="ml-2 rounded-sm bg-[#FFE600] px-1.5 py-0.5 text-[0.6875rem] font-medium text-[#0A0A0A]">
                  Destacado
                </span>
              ) : null}
            </h2>
            <time className="text-xs text-[#5C6570]">
              {formatPublicDate(notice.published_at)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5C6570]">
            {notice.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
