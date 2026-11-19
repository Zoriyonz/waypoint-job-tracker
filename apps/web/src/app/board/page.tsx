import type { Metadata } from "next";
import { Board } from "@/components/Board";

export const metadata: Metadata = { title: "Board · Waypoint" };

export default function BoardPage() {
  return <Board />;
}
