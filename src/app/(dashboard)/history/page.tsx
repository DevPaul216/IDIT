import PageWrapper from "@/components/layout/PageWrapper";
import InventoryHistory from "@/components/features/inventory/InventoryHistory";

export default function HistoryPage() {
  return (
    <PageWrapper
      title="Änderungsverlauf"
      description="Alle Änderungen am Lagerbestand"
    >
      <InventoryHistory />
    </PageWrapper>
  );
}
