import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Btn, DataTable, Field, Panel, SelectInput, TextInput } from "./brutal";
import { deleteRow, insertRow, updateRow } from "@/lib/queries";

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  default?: string | number | boolean;
  required?: boolean;
  span?: 1 | 2;
};

type Row = Record<string, unknown> & { id: string };

export function CrudManager({
  table,
  queryKeys,
  fields,
  rows,
  head,
  renderRow,
  accent = "sun",
  formTitle,
}: {
  table: string;
  queryKeys: string[][];
  fields: FieldDef[];
  rows: Row[];
  head: string[];
  renderRow: (row: Row) => React.ReactNode;
  accent?: "sun" | "cobalt" | "signal" | "orchid";
  formTitle: string;
}) {
  const qc = useQueryClient();
  const blank = () =>
    Object.fromEntries(
      fields.map((f) => [f.key, f.default ?? (f.type === "checkbox" ? false : "")]),
    );
  const [form, setForm] = useState<Record<string, unknown>>(blank());
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => queryKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const v = form[f.key];
        if (f.type === "number") payload[f.key] = Number(v) || 0;
        else if (f.type === "checkbox") payload[f.key] = Boolean(v);
        else payload[f.key] = v === "" ? null : v;
      }
      if (editing) await updateRow(table, editing, payload);
      else await insertRow(table, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Record updated" : "Record added");
      setForm(blank());
      setEditing(null);
      setShowForm(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => {
      toast.success("Record deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (row: Row) => {
    const next: Record<string, unknown> = {};
    for (const f of fields) next[f.key] = row[f.key] ?? (f.type === "checkbox" ? false : "");
    setForm(next);
    setEditing(row.id);
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <Panel
        title={editing ? `${formTitle} — editing` : formTitle}
        subtitle={`${rows.length} records in store`}
        accent={accent}
        right={
          <div className="flex gap-2">
            {showForm ? (
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(blank());
                }}
              >
                <X className="size-3" /> Close
              </Btn>
            ) : (
              <Btn size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-3" /> New record
              </Btn>
            )}
          </div>
        }
      >
        {showForm ? (
          <form
            className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {fields.map((f) => (
              <div key={f.key} className={f.span === 2 ? "sm:col-span-2" : ""}>
                <Field label={f.label}>
                  {f.type === "select" ? (
                    <SelectInput
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    >
                      <option value="">— none —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </SelectInput>
                  ) : f.type === "checkbox" ? (
                    <button
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, [f.key]: !s[f.key] }))}
                      className="brutal-border w-full bg-background px-3 py-2 text-left font-mono text-xs uppercase"
                    >
                      {form[f.key] ? "YES" : "NO"}
                    </button>
                  ) : (
                    <TextInput
                      type={f.type}
                      required={f.required}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
            ))}
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Btn type="submit" disabled={save.isPending} variant="cobalt">
                {save.isPending ? "Saving…" : editing ? "Update record" : "Add record"}
              </Btn>
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel title="Records" subtitle="Stored in Cloud Database">
        <DataTable head={[...head, "Actions"]}>
          {rows.map((row) => (
            <tr key={row.id} className="border-b-2 border-ink/10 last:border-b-0 hover:bg-sun/20">
              {renderRow(row)}
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(row)}
                    className="brutal-border bg-card p-1.5 hover:bg-sun"
                    aria-label="Edit"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    onClick={() => remove.mutate(row.id)}
                    className="brutal-border bg-card p-1.5 hover:bg-signal hover:text-paper"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={head.length + 1}
                className="px-3 py-6 text-center text-muted-foreground uppercase"
              >
                No records yet
              </td>
            </tr>
          ) : null}
        </DataTable>
      </Panel>
    </div>
  );
}
