import { Suspense } from "react";
import { Studio } from "@/components/Studio";
import { getPublicSet } from "@/lib/public-set";

export default function StudioPage() {
  const set = getPublicSet();
  return (
    <Suspense fallback={<div className="phone" />}>
      <Studio set={set} />
    </Suspense>
  );
}
