import { Collection } from "@/components/Collection";
import { getPublicSet } from "@/lib/public-set";

export default function CollectionPage() {
  return <Collection set={getPublicSet()} />;
}
