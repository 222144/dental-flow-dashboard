import { ReactNode, useState } from "react";
import { Eye, Search, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export type FieldSearchOption<T> = {
  key: keyof T;
  label: string;
};

type Props<T> = {
  title: string;
  description?: string;
  data: T[];
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  fieldSearchOptions?: FieldSearchOption<T>[];
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
  fieldSearchOptions,
  addLabel = "إضافة جديد",
  rowLink,
  onEdit,
  onDelete,
  filters,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [selectedSearchKey, setSelectedSearchKey] = useState<keyof T | "none">("none");
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null);
  const [activeRow, setActiveRow] = useState<T | null>(null);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const filtered = data.filter((row) =>
    query.trim() === ""
      ? true
      : selectedSearchKey !== "none"
        ? String(row[selectedSearchKey] ?? "")
            .toLowerCase()
            .includes(query.toLowerCase())
        : searchKeys.some((k) =>
            String(row[k] ?? "")
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
  );

  const hasFieldSearch = Boolean(fieldSearchOptions?.length);

  const openDialog = (mode: "view" | "edit", row: T) => {
    setDialogMode(mode);
    setActiveRow(row);
    setDraft(
      Object.fromEntries(columns.map((column) => [String(column.key), String((row as any)[column.key] ?? "")])),
    );
  };

  const closeDialog = () => {
    setDialogMode(null);
    setActiveRow(null);
    setDraft({});
  };

  if (dialogMode && activeRow) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-6 space-y-6" dir="rtl">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div>
              <p className="text-xs font-semibold text-action">
                {dialogMode === "edit" ? "تعديل السجل" : "عرض السجل"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {String((activeRow as any).name ?? title)}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {dialogMode === "edit"
                  ? "يمكنك تعديل البيانات الأساسية ثم حفظ التغييرات."
                  : "معلومات السجل المختار معروضة داخل الصفحة بدون نافذة."}
              </p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-muted"
          >
            رجوع
          </button>
        </div>

        {dialogMode === "view" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {columns.map((column) => (
              <div key={String(column.key)} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-xs font-semibold text-muted-foreground">{column.header}</p>
                <div className="mt-2 text-base font-semibold text-foreground">
                  {column.render ? column.render(activeRow) : String((activeRow as any)[column.key] ?? "—")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {columns.map((column) => (
                <label key={String(column.key)} className="space-y-2 text-sm font-medium text-foreground">
                  <span>{column.header}</span>
                  <input
                    value={draft[String(column.key)] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [String(column.key)]: event.target.value }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <button onClick={closeDialog} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
                إلغاء
              </button>
              <button onClick={closeDialog} className="rounded-lg bg-[image:var(--gradient-action)] px-5 py-2.5 text-sm font-semibold text-action-foreground shadow-md hover:brightness-105">
                حفظ التعديلات
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {hasFieldSearch && (
              <select
                value={String(selectedSearchKey)}
                onChange={(event) => {
                  setSelectedSearchKey(event.target.value === "none" ? "none" : (event.target.value as keyof T));
                  setQuery("");
                }}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="none">لا شيء</option>
                {fieldSearchOptions?.map((option) => (
                  <option key={String(option.key)} value={String(option.key)}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {(!hasFieldSearch || selectedSearchKey !== "none") && (
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث في السجلات…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            )}
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
                          <a href={rowLink(row)} className="font-medium text-primary hover:underline">
                            {content}
                          </a>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                  <td className="px-5 py-4 text-left">
                    <div className="inline-flex items-center gap-2">
                       <button
                         onClick={() => openDialog("view", row)}
                         className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-secondary/80"
                       >
                         <Eye className="h-3.5 w-3.5" />
                         عرض
                       </button>
                      <button
                         onClick={() => {
                           onEdit?.(row);
                           openDialog("edit", row);
                         }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </button>
                      <button
                         onClick={() => setRowToDelete(row)}
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
      <Dialog open={Boolean(rowToDelete)} onOpenChange={(open) => !open && setRowToDelete(null)}>
        <DialogContent className="text-right sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>هل أنت متأكد؟</DialogTitle>
            <DialogDescription>
              سيتم حذف هذا السجل من الجدول. لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <button
              onClick={() => setRowToDelete(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                if (rowToDelete) {
                  onDelete?.(rowToDelete);
                }
                setRowToDelete(null);
              }}
              className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-action-foreground hover:bg-action-hover"
            >
              تأكيد الحذف
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
