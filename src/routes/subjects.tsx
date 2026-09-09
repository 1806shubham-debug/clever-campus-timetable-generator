import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudManager } from "@/components/CrudManager";
import { PageHead, Tag } from "@/components/brutal";
import { batchesQuery, facultyQuery, subjectsQuery } from "@/lib/queries";
import { Loading } from "./faculty";

export const Route = createFileRoute("/subjects")({
  head: () => ({
    meta: [
      { title: "Subject Catalogue — Timetable OPT" },
      {
        name: "description",
        content: "Courses with credits, weekly hours, assigned faculty and owning batch.",
      },
      { property: "og:title", content: "Subject Catalogue — Timetable OPT" },
      { property: "og:description", content: "Courses with credits, weekly hours, faculty and batch." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { data: subjects = [], isLoading } = useQuery(subjectsQuery);
  const { data: faculty = [] } = useQuery(facultyQuery);
  const { data: batches = [] } = useQuery(batchesQuery);

  const facMap = new Map(faculty.map((f) => [f.id, f.code]));
  const batchMap = new Map(batches.map((b) => [b.id, b.code]));

  return (
    <div>
      <PageHead
        eyebrow="Master Data / 02"
        title="Subject Catalogue"
        description="Weekly hours drive the number of lesson units each optimizer must place on the grid."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <CrudManager
          table="subjects"
          queryKeys={[["subjects"]]}
          formTitle="Subject record"
          accent="cobalt"
          rows={subjects as never}
          fields={[
            { key: "name", label: "Subject name", type: "text", required: true, span: 2 },
            { key: "code", label: "Code", type: "text", required: true },
            { key: "credits", label: "Credits", type: "number", default: 3 },
            { key: "hours_per_week", label: "Hours / week", type: "number", default: 3 },
            {
              key: "subject_type",
              label: "Type",
              type: "select",
              options: ["Theory", "Lab", "Tutorial"].map((t) => ({ value: t, label: t })),
              default: "Theory",
            },
            {
              key: "faculty_id",
              label: "Faculty",
              type: "select",
              options: faculty.map((f) => ({ value: f.id, label: `${f.code} · ${f.name}` })),
            },
            {
              key: "batch_id",
              label: "Batch",
              type: "select",
              options: batches.map((b) => ({ value: b.id, label: `${b.code} · ${b.name}` })),
            },
            { key: "requires_lab", label: "Needs lab room", type: "checkbox", default: false },
          ]}
          head={["Code", "Subject", "Type", "Hrs/wk", "Credits", "Faculty", "Batch"]}
          renderRow={(row) => (
            <>
              <td className="px-3 py-2 font-bold">{String(row["code"])}</td>
              <td className="px-3 py-2">{String(row["name"])}</td>
              <td className="px-3 py-2">
                <Tag tone={row["subject_type"] === "Lab" ? "cobalt" : "sun"}>
                  {String(row["subject_type"])}
                </Tag>
              </td>
              <td className="px-3 py-2">{String(row["hours_per_week"])}</td>
              <td className="px-3 py-2">{String(row["credits"])}</td>
              <td className="px-3 py-2">{facMap.get(String(row["faculty_id"])) ?? "—"}</td>
              <td className="px-3 py-2">{batchMap.get(String(row["batch_id"])) ?? "—"}</td>
            </>
          )}
        />
      )}
    </div>
  );
}
