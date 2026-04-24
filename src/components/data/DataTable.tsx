import { ReactNode, useState } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  addLabel?: string;
  rowLink?: (row: T) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  filters?: ReactNode;
};

export function DataTable<T extends { id: string | number }>({
  title,
  description,
  data,
  columns,
  searchKeys,
  addLabel = "إضافة جديد",
  rowLink,
  onEdit,
  onDelete,
  filters,
}: Props<T>) {
  const [query, setQuery] = useState("");

  const filtered = data.filter((row) =>
    query.trim() === ""
      ? true
      : searchKeys.some((k) =>
          String(row[k] ?? "")
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-action)] px-5 py-3 text-sm font-semibold text-action-foreground shadow-md transition hover:brightness-105 active:brightness-95">
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في السجلات…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {filters}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/60 text-right text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                {columns.map((c) => (
                  <th key={String(c.key)} className={`px-5 py-3 ${c.className ?? ""}`}>
                    {c.header}
                  </th>
                ))}
                <th className="px-5 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border transition hover:bg-accent/30"
                >
                  {columns.map((c) => {
                    const content = c.render
                      ? c.render(row)
                      : (row as any)[c.key];
                    return (
                      <td key={String(c.key)} className="px-5 py-4 align-middle">
                        {rowLink && c === columns[0] ? (
                          <Link
                            to={rowLink(row)}
                            className="font-medium text-primary hover:underline"
                          >
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-4 text-left">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit?.(row)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </button>
                      <button
                        onClick={() => onDelete?.(row)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-action px-3 py-1.5 text-xs font-semibold text-action-foreground transition hover:bg-action-hover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    لا توجد سجلات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>
            عرض <strong>{filtered.length}</strong> من أصل {data.length} سجل
          </span>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">
              السابق
            </button>
            <button className="rounded-md border border-border px-2 py-1 hover:bg-muted">
              التالي
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
