import { TextShimmer } from "@/components/ui/text-shimmer";

export function TextShimmerExample() {
  return (
    <div className="space-y-4 p-4">
      <TextShimmer className="text-sm" duration={1.5} repeatDelay={0.5}>
        Loading...
      </TextShimmer>

      <TextShimmer className="text-lg font-medium" duration={2} repeatDelay={1}>
        Fetching data...
      </TextShimmer>

      <TextShimmer className="text-xl font-bold text-primary" duration={1} repeatDelay={0.3}>
        Processing your request
      </TextShimmer>

      <p className="text-muted-foreground">
        Static text with <TextShimmer className="font-medium" duration={1.5} repeatDelay={0.5}>shimmering portion</TextShimmer> inline.
      </p>
    </div>
  );
}