import PageWrapper from "@/components/layout/PageWrapper";
import InventoryCapture from "@/components/features/inventory/InventoryCapture";
import SnapshotHistory from "@/components/features/inventory/SnapshotHistory";

export default function InventoryPage() {
  return (
    <PageWrapper
      title="Lagerbestand erfassen"
      description="Tippen Sie auf einen Lagerplatz, um Paletten zu erfassen."
    >
      <div className="space-y-6">
        <InventoryCapture />
        <SnapshotHistory />
      </div>
    </PageWrapper>
  );
}
