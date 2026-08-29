// Server component — this is what actually resolves at /showroom/[carId]/services.
// It does the two things Services.tsx (a client component) can't do itself:
//   1. Call requireUser(), which reads cookies/session server-side.
//   2. Read the route's `params` directly (no useParams() needed on the server).
// Both are then handed down to <Services /> as plain props.
//
// TODO: adjust the import path/shape below to match your real requireUser().
// Assumed here: an async function that reads the session and either returns
// the user or redirects/throws if there isn't one (hence no null-check for
// `user` below — if your version can return null instead, add a check and
// redirect to your sign-in page before rendering Services).
import { requireUser } from '@/lib/IAM/validators';
import Services from './service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ServicesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();

  return <Services customerId={String(user.user_id)} carId={id} />;
}