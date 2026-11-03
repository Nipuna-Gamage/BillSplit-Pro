import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { GroupDetailPage } from "@/components/groups/group-detail-page";

async function GroupPageContent(props: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await props.params;

  return <GroupDetailPage groupId={groupId} />;
}

export default function Page(props: {
  params: Promise<{ groupId: string }>;
}) {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="groups-screen">
            <div className="group-not-found" role="status">
              Loading group details…
            </div>
          </div>
        }
      >
        <GroupPageContent params={props.params} />
      </Suspense>
    </AppShell>
  );
}
