import type { Metadata } from "next";
import { RestaurantsPage } from "@/features/restaurants/pages";

export const metadata: Metadata = { title: "Restaurants" };

export default function Page() {
  return <RestaurantsPage />;
}
