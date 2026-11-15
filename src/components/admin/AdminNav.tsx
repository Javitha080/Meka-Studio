"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  CalendarCheck,
  Clapperboard,
  ExternalLink,
  HelpCircle,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/actions";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/projects", label: "Portfolio", icon: Clapperboard },
  { href: "/admin/media", label: "Media library", icon: Images },
  { href: "/admin/services", label: "Services", icon: Sparkles },
  { href: "/admin/packages", label: "Packages & prices", icon: BadgeDollarSign },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/faqs", label: "FAQ", icon: HelpCircle },
  { href: "/admin/subscribers", label: "Subscribers", icon: Newspaper },
  { href: "/admin/emails", label: "E-mail log", icon: Mail },
  { href: "/admin/team", label: "Team", icon: Users, owner: true },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

export function AdminNav({ name, role, newCount }: { name: string; role: string; newCount: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="glass sticky top-0 z-40 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 md:hidden">
        <span className="text-sm font-extrabold uppercase tracking-[0.26em] text-silver">Meka CMS</span>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="rounded-full p-2 hover:bg-white/10">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <aside
        className={`glass fixed inset-x-0 bottom-0 top-[57px] z-30 flex-col overflow-y-auto rounded-none border-0 border-white/10 bg-black/95 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:border-r md:bg-transparent ${
          open ? "flex" : "hidden"
        }`}
      >
        <div className="hidden px-5 py-6 md:block">
          <div className="text-sm font-extrabold uppercase tracking-[0.26em] text-silver">Meka CMS</div>
          <div className="mt-1 truncate text-xs text-silver">{name}</div>
          <div className="label mt-0.5 !text-[10px] !text-signal">{role}</div>
        </div>
        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3 py-3 md:py-0">
          {ITEMS.filter((i) => !i.owner || role === "owner").map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-signal text-black" : "text-silver hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
                {href === "/admin/bookings" && newCount > 0 && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] ${active ? "bg-black text-signal" : "bg-signal text-black"}`}>{newCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex gap-4 px-5 py-5 md:flex-col md:gap-3">
          <Link href="/" target="_blank" className="label flex items-center gap-2 hover:text-signal">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View site
          </Link>
          <form action={logoutAction}>
            <button className="label flex items-center gap-2 hover:text-red-400">
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
