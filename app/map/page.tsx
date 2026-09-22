import JamMap from "@/components/JamMap";
import { mockBars, mockOccurrences } from "@/lib/mock-jams";

export default function MapPage() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex-shrink-0 px-10 py-6">
        <div className="text-xs font-medium tracking-wide uppercase text-[color:var(--color-warm-cream)]">
          Jamix — carte des jams
        </div>
        <h1 className="mt-1 text-2xl font-medium uppercase leading-[1.09] text-[color:var(--color-warm-cream)]">
          Lyon, ce soir
        </h1>
      </header>
      <div className="relative flex-1">
        <JamMap bars={mockBars} occurrences={mockOccurrences} />
      </div>
    </div>
  );
}
