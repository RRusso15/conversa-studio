import { BillingWorkspace } from "@/components/developer/BillingWorkspace";
import { BillingProvider } from "@/providers/billingProvider";

export default function DeveloperBillingPage() {
  return (
    <BillingProvider>
      <BillingWorkspace />
    </BillingProvider>
  );
}
