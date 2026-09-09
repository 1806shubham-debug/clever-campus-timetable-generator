import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudManager } from "@/components/CrudManager";
import { PageHead, Tag } from "@/components/brutal";
import { roomsQuery } from "@/lib/queries";
import { Loading } from "./faculty";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Room Inventory — Timetable OPT" },
      { name: "description", content: "Lecture halls, labs and seminar rooms with capacity and building." },
      { property: "og:title", content: "Room Inventory — Timetable OPT" },
      { property: "og:description", content: "Lecture halls, labs and seminar rooms with capacities." },
    ],
  }),
  component: RoomsPage,
});

const TYPES = ["Lecture Hall", "Lab", "Seminar Room", "Auditorium"];

function RoomsPage() {
  const { data: rooms = [], isLoading } = useQuery(roomsQuery);
  return (
    <div>
      <PageHead
        eyebrow="Master Data / 03"
        title="Room Inventory"
        description="Physical resources. Capacity and room type are enforced as hard constraints during scheduling."
      />
      {isLoading ? (
        <Loading />
      ) : (
        <CrudManager
          table="rooms"
          queryKeys={[["rooms"]]}
          formTitle="Room record"
          accent="cobalt"
          rows={rooms as never}
          fields={[
            { key: "name", label: "Room name", type: "text", required: true },
            { key: "code", label: "Code", type: "text", required: true },
            { key: "capacity", label: "Capacity", type: "number", default: 60 },
            {
              key: "room_type",
              label: "Type",
              type: "select",
              options: TYPES.map((t) => ({ value: t, label: t })),
              default: "Lecture Hall",
            },
            { key: "building", label: "Building", type: "text", default: "Main Block" },
          ]}
          head={["Code", "Name", "Type", "Capacity", "Building"]}
          renderRow={(row) => (
            <>
              <td className="px-3 py-2 font-bold">{String(row["code"])}</td>
              <td className="px-3 py-2">{String(row["name"])}</td>
              <td className="px-3 py-2">
                <Tag tone={row["room_type"] === "Lab" ? "cobalt" : "sun"}>{String(row["room_type"])}</Tag>
              </td>
              <td className="px-3 py-2">{String(row["capacity"])}</td>
              <td className="px-3 py-2">{String(row["building"])}</td>
            </>
          )}
        />
      )}
    </div>
  );
}
