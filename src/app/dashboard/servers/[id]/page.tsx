import ServerDetailClient from "./ServerDetailClient";

// Required for static export (output: 'export'): pre-define paths for [id].
// Only one path is generated; other server IDs work via client-side nav from dashboard when JS runs.
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default function ServerDetailPage() {
  return <ServerDetailClient />;
}
