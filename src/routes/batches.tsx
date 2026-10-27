import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudManager } from "@/components/CrudManager";
import { Loading, PageHead, Tag } from "@/components/brutal";
import { batchesQuery } from "@/lib/queries";

export const Route = createFileRoute("/batches")({
  head: () => ({
    meta: [
      { title: "Student Batches — Timetable OPT" },
      {
        name: "description",
        content: "Departments, semesters and class strengths that must be scheduled.",
      },
      { property: "og:title", content: "Student Batches — Timetable OPT" },
      { property: "og:description", content: "Departments, semesters and class strengths." },
    ],
  }),
  component: BatchesPage,
});

const DEPTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"];

function BatchesPage() {
  const { data: batches = [], isLoading } = useQuery(batchesQuery);
  return (
    <div>
      <PageHead
        eyebrow="Master Data / 04"
        title="Student Batches"
        description="Each batch is a scheduling unit — it can attend only one class per time slot."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <CrudManager
          table="batches"
          queryKeys={[["batches"], ["subjects"]]}
          formTitle="Batch record"
          accent="orchid"
          rows={batches as never}
          fields={[
            { key: "name", label: "Batch name", type: "text", required: true },
            { key: "code", label: "Code", type: "text", required: true },
            {
              key: "department",
              label: "Department",
              type: "select",
              options: DEPTS.map((d) => ({ value: d, label: d })),
              default: "CSE",
            },
            { key: "semester", label: "Semester", type: "number", default: 3 },
            { key: "strength", label: "Strength", type: "number", default: 60 },
          ]}
          head={["Code", "Name", "Dept", "Semester", "Strength"]}
          renderRow={(row) => (
            <>
              <td className="px-3 py-2 font-bold">{String(row["code"])}</td>
              <td className="px-3 py-2">{String(row["name"])}</td>
              <td className="px-3 py-2">
                <Tag tone="orchid">{String(row["department"])}</Tag>
              </td>
              <td className="px-3 py-2">S{String(row["semester"])}</td>
              <td className="px-3 py-2">{String(row["strength"])}</td>
            </>
          )}
        />
      )}
    </div>
  );
}
