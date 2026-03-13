import PageWrapper from "@/components/layout/PageWrapper";
import InventoryCapture from "@/components/features/inventory/InventoryCapture";

export default function InventoryPage() {
  return (
    <PageWrapper
      title="Lagerbestand erfassen"
      description="Tippen Sie auf eine Zone, um Paletten zu erfassen."
    >
      <InventoryCapture />
    </PageWrapper>
  );
}
