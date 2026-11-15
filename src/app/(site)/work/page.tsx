import type { Metadata } from "next";
import { Work } from "@/components/site/Work";
import { getProjects } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Work",
  description: "Wedding films, events, pre-shoots and brand stories — the full Meka Studio portfolio.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await getProjects();
  return <Work projects={projects} standalone />;
}
