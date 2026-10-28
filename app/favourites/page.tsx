import type { Metadata } from "next";
import { FavouritesView } from "@/components/favourites-view";

export const metadata: Metadata = { title: "Favourites" };

export default function FavouritesPage() {
  return (
    <div className="mx-auto max-w-[2000px] px-4 py-8 sm:px-6">
      <FavouritesView />
    </div>
  );
}
