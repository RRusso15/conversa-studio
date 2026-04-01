import { TranscriptsWorkspace } from "@/components/developer/TranscriptsWorkspace";
import { TranscriptProvider } from "@/providers/transcriptProvider";

export default function DeveloperTranscriptsPage() {
  return (
    <TranscriptProvider>
      <TranscriptsWorkspace />
    </TranscriptProvider>
  );
}
