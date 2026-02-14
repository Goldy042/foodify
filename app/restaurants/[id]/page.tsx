import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function LegacyRestaurantDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  redirect(`/app/restaurants/${resolvedParams.id}`);
}
