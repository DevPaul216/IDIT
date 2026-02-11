import PageWrapper from "@/components/layout/PageWrapper";
import InventoryCapture from "@/components/features/inventory/InventoryCapture";

export default function InventoryPage() {
  return (
    <PageWrapper
      title="Lagerbestand erfassen"
      description="Tippen Sie auf einen Lagerplatz, um Paletten zu erfassen."
    >
      <InventoryCapture />
    </PageWrapper>
  );
}
