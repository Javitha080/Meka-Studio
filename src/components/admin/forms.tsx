"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Mail, MessageCircle, Pencil, Phone, Search, Send, Star, Trash2 } from "lucide-react";
import {
  addTeamMemberAction,
  deleteBookingAction,
  deleteResourceAction,
  forgotPasswordAction,
  loginAction,
  replyBookingAction,
  saveResourceAction,
  saveSettingsAction,
  sendTestMailAction,
  setupAction,
  toggleFlagAction,
  updateBookingAction,
  updatePasswordAction,
  type FormState,
} from "@/app/admin/actions";
import { GalleryField, MediaField, isImageUrl, isVideoUrl, type Accept } from "@/components/admin/media";
import type { ResourceDef } from "@/lib/resources";
import type { FieldDef } from "@/lib/validation";

const initial: FormState = {};

export function Notice({ state }: { state: FormState }) {
  if (!state.error && !state.message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        state.error ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-signal/40 bg-signal/10 text-signal"
      }`}
    >
      {state.error ?? state.message}
    </p>
  );
}

function Submit({ pending, children, className = "" }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button type="submit" disabled={pending} className={`btn btn-primary disabled:opacity-60 ${className}`}>
      {pending ? "Working…" : children}
    </button>
  );
}

const Label = ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => (
  <label htmlFor={htmlFor} className="label mb-2 block">
    {children}
  </label>
);

/* ───────────── Auth ───────────── */

export function LoginForm({ resetOk }: { resetOk?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="field pr-12" />
          <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-white">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {resetOk && <p className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-3 text-sm text-signal">Password updated — sign in.</p>}
      <Notice state={state} />
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="fp-email">Reset password by e-mail</Label>
        <input id="fp-email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <Notice state={state} />
      <Submit pending={pending} className="btn-ghost !bg-transparent">
        Send reset link
      </Submit>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="np">New password (10+ chars, upper, lower, number)</Label>
        <input id="np" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <div>
        <Label htmlFor="cp">Confirm password</Label>
        <input id="cp" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <Notice state={state} />
      <Submit pending={pending}>Update password</Submit>
    </form>
  );
}

export function SetupForm({ needsToken }: { needsToken: boolean }) {
  const [state, action, pending] = useActionState(setupAction, initial);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <Label htmlFor="name">Your name</Label>
        <input id="name" name="name" required autoComplete="name" className="field" />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <Label htmlFor="password">Password (10+ chars, upper, lower, number)</Label>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      {needsToken && (
        <div>
          <Label htmlFor="token">Setup token</Label>
          <input id="token" name="token" type="password" required className="field" />
        </div>
      )}
      <Notice state={state} />
      <Submit pending={pending}>Create owner account</Submit>
    </form>
  );
}

/* ───────────── Generic resource manager ───────────── */

type Row = Record<string, unknown> & { id: string };
type Opts = Record<string, Array<{ value: string; label: string }>>;

function FieldInput({ f, row, opts }: { f: FieldDef; row: Row | null; opts?: Opts }) {
  const id = `f-${f.name}`;
  const v = row?.[f.name];
  const base = (
    <>
      {f.type === "text" && <input id={id} name={f.name} defaultValue={String(v ?? "")} required={f.required} maxLength={f.max} className="field" />}
      {f.type === "number" && <input id={id} name={f.name} type="number" defaultValue={v == null ? "" : String(v)} className="field" />}
      {f.type === "textarea" && <textarea id={id} name={f.name} defaultValue={String(v ?? "")} required={f.required} className="field" />}
      {f.type === "media" && <MediaField id={id} name={f.name} defaultValue={String(v ?? "")} accept={(f.accept as Accept) ?? "any"} />}
      {f.type === "gallery" && <GalleryField name={f.name} defaultValue={Array.isArray(v) ? (v as string[]) : []} />}
      {f.type === "select" && (
        <select id={id} name={f.name} defaultValue={String(v ?? "")} className="field">
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
          {f.optionsFrom &&
            (opts?.[f.optionsFrom] ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        </select>
      )}
    </>
  );
  if (f.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 text-sm text-silver">
        <input type="checkbox" name={f.name} defaultChecked={row ? Boolean(v) : f.name === "published"} className="h-5 w-5 accent-[#2dff8a]" />
        {f.label}
      </label>
    );
  }
  return (
    <div className={f.wide ? "sm:col-span-2" : ""}>
      <Label htmlFor={id}>{f.label}</Label>
      {base}
      {f.help && <p className="mt-1.5 text-xs text-mute">{f.help}</p>}
    </div>
  );
}

function ResourceForm({ def, row, opts, onDone }: { def: ResourceDef; row: Row | null; opts?: Opts; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveResourceAction, initial);
  useEffect(() => {
    if (state.ok) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="_resource" value={def.key} />
      <input type="hidden" name="_id" value={row?.id ?? ""} />
      {def.fields.map((f) => (
        <FieldInput key={f.name} f={f} row={row} opts={opts} />
      ))}
      <div className="grid gap-4 sm:col-span-2">
        <Notice state={state} />
        <div className="flex gap-3">
          <Submit pending={pending}>{row ? "Save changes" : `Create ${def.label.toLowerCase()}`}</Submit>
          <button type="button" onClick={onDone} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function RowThumb({ row }: { row: Row }) {
  const url = String(row.posterUrl || row.previewVideoUrl || "");
  if (!url) return null;
  return isVideoUrl(url) ? (
    <video src={`${url}#t=0.5`} muted playsInline preload="metadata" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
  ) : isImageUrl(url) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" loading="lazy" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
  ) : null;
}

export function ResourceManager({ def, rows, opts }: { def: ResourceDef; rows: Row[]; opts?: Opts }) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [q, setQ] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editing) dialog.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editing]);

  const label = (r: Row, key?: string) => {
    if (!key) return "";
    const raw = r[key];
    const mapped = def.fields.find((f) => f.name === key);
    if (mapped?.optionsFrom) return opts?.[mapped.optionsFrom]?.find((o) => o.value === raw)?.label ?? "";
    return String(raw ?? "");
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => `${label(r, def.titleField)} ${label(r, def.subtitleField)}`.toLowerCase().includes(needle));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q]);

  const Toggle = ({ r, flag, on, children }: { r: Row; flag: "published" | "featured"; on: boolean; children: ReactNode }) => (
    <form action={toggleFlagAction}>
      <input type="hidden" name="_resource" value={def.key} />
      <input type="hidden" name="_id" value={r.id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(!on)} />
      {children}
    </form>
  );

  return (
    <section className="mb-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          {def.plural} <span className="ml-1 font-mono text-sm font-normal text-mute">{rows.length}</span>
        </h2>
        <div className="flex items-center gap-3">
          {rows.length > 6 && (
            <label className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search" className="field !w-52 !py-2.5 !pl-9 !text-sm" />
            </label>
          )}
          <button className="btn btn-primary !px-6 !py-3" onClick={() => setEditing("new")}>
            + New {def.label.toLowerCase()}
          </button>
        </div>
      </div>

      {editing && (
        <div ref={dialog} className="glass mb-6 rounded-3xl p-6 md:p-8">
          <h3 className="mb-6 text-lg font-extrabold uppercase tracking-wide text-signal">
            {editing === "new" ? `New ${def.label.toLowerCase()}` : `Edit ${def.label.toLowerCase()}`}
          </h3>
          <ResourceForm key={editing === "new" ? "new" : editing.id} def={def} row={editing === "new" ? null : editing} opts={opts} onDone={() => setEditing(null)} />
        </div>
      )}

      <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10">
        {filtered.length === 0 && <li className="p-8 text-center text-mute">Nothing here yet.</li>}
        {filtered.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] px-5 py-4">
            <div className="flex min-w-0 items-center gap-4">
              <RowThumb row={r} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-bold">{label(r, def.titleField)}</span>
                  {"published" in r && !r.published && (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-mono text-[10px] uppercase text-mute">Draft</span>
                  )}
                  {"featured" in r && Boolean(r.featured) && (
                    <span className="rounded-full border border-signal/50 px-2 py-0.5 font-mono text-[10px] uppercase text-signal">Featured</span>
                  )}
                </div>
                <div className="truncate font-mono text-xs text-mute">{label(r, def.subtitleField)}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {"published" in r && (
                <Toggle r={r} flag="published" on={Boolean(r.published)}>
                  <button className="rounded-full p-2.5 text-mute hover:bg-white/10 hover:text-white" aria-label={r.published ? "Unpublish" : "Publish"} title={r.published ? "Unpublish" : "Publish"}>
                    {r.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </Toggle>
              )}
              {"featured" in r && (
                <Toggle r={r} flag="featured" on={Boolean(r.featured)}>
                  <button className={`rounded-full p-2.5 hover:bg-white/10 ${r.featured ? "text-signal" : "text-mute hover:text-white"}`} aria-label="Toggle featured" title="Toggle featured">
                    <Star className="h-4 w-4" fill={r.featured ? "currentColor" : "none"} />
                  </button>
                </Toggle>
              )}
              <button className="rounded-full p-2.5 text-mute hover:bg-white/10 hover:text-white" onClick={() => setEditing(r)} aria-label="Edit" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <form
                action={deleteResourceAction}
                onSubmit={(e) => {
                  if (!confirm(`Delete this ${def.label.toLowerCase()}? This cannot be undone.`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="_resource" value={def.key} />
                <input type="hidden" name="_id" value={r.id} />
                <button className="rounded-full p-2.5 text-mute hover:bg-red-500/10 hover:text-red-400" aria-label="Delete" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────── Bookings ───────────── */

const STATUS_COLORS: Record<string, string> = {
  new: "border-signal text-signal",
  contacted: "border-sky-400 text-sky-300",
  confirmed: "border-emerald-400 text-emerald-300",
  completed: "border-white/30 text-silver",
  cancelled: "border-red-500/50 text-red-300",
};

export interface BookingRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  preferredDate: string;
  location: string;
  message: string;
  status: string;
  notes: string;
  createdAt: string;
}

function ReplyBox({ b }: { b: BookingRow }) {
  const [state, action, pending] = useActionState(replyBookingAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <input type="hidden" name="id" value={b.id} />
      <input name="subject" required defaultValue={`Re: your ${b.shootType} enquiry`} className="field !py-3" aria-label="Subject" />
      <textarea name="body" required placeholder={`Write to ${b.name}…`} className="field" aria-label="Message" />
      <Notice state={state} />
      <div>
        <button disabled={pending} className="btn btn-primary !px-6 !py-3">
          <Send className="h-4 w-4" aria-hidden /> {pending ? "Sending…" : "Send via Mailgun"}
        </button>
      </div>
    </form>
  );
}

export function BookingCard({ b, statuses, waLink }: { b: BookingRow; statuses: readonly string[]; waLink: string | null }) {
  const [state, action, pending] = useActionState(updateBookingAction, initial);
  const [reply, setReply] = useState(false);
  return (
    <article className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold">{b.name}</h3>
          <p className="font-mono text-xs text-mute">{new Date(b.createdAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${STATUS_COLORS[b.status] ?? ""}`}>{b.status}</span>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Type", b.shootType],
          ["Date", b.preferredDate || "—"],
          ["Location", b.location || "—"],
          ["Phone", b.phone || "—"],
          ["E-mail", b.email || "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label">{k}</dt>
            <dd className="mt-0.5 break-words text-silver">{v}</dd>
          </div>
        ))}
      </dl>
      {b.message && <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/[0.04] p-4 text-sm text-silver/90">{b.message}</p>}

      <form action={action} className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-start">
        <input type="hidden" name="id" value={b.id} />
        <select name="status" defaultValue={b.status} className="field !py-3" aria-label="Status">
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <textarea name="notes" defaultValue={b.notes} placeholder="Private notes…" className="field !min-h-[48px] !py-3" aria-label="Notes" />
        <button disabled={pending} className="btn btn-primary !py-3.5">
          {pending ? "…" : "Save"}
        </button>
        {b.email && (
          <label className="flex items-center gap-2 text-xs text-mute md:col-span-3">
            <input type="checkbox" name="notify" className="h-4 w-4 accent-[#2dff8a]" /> E-mail the client when the status changes
          </label>
        )}
        <div className="md:col-span-3">
          <Notice state={state} />
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {b.phone && (
          <a className="btn btn-ghost !px-5 !py-2.5" href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>
            <Phone className="h-3.5 w-3.5" aria-hidden /> Call
          </a>
        )}
        {waLink && (
          <a className="btn btn-ghost !px-5 !py-2.5" href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
          </a>
        )}
        {b.email && (
          <button type="button" className="btn btn-ghost !px-5 !py-2.5" onClick={() => setReply((r) => !r)} aria-expanded={reply}>
            <Mail className="h-3.5 w-3.5" aria-hidden /> Reply
          </button>
        )}
        <form
          action={deleteBookingAction}
          onSubmit={(e) => {
            if (!confirm("Delete this booking permanently?")) e.preventDefault();
          }}
          className="ml-auto"
        >
          <input type="hidden" name="id" value={b.id} />
          <button className="btn btn-ghost !px-5 !py-2.5 hover:!border-red-400 hover:!text-red-400">
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
          </button>
        </form>
      </div>
      {reply && b.email && <ReplyBox b={b} />}
    </article>
  );
}

/* ───────────── Settings ───────────── */

type SettingField = { name: string; label: string; type?: "textarea" | "media"; accept?: Accept; wide?: boolean; help?: string };

export const SETTING_GROUPS: Array<{ title: string; fields: SettingField[] }> = [
  {
    title: "Brand & hero",
    fields: [
      { name: "studioName", label: "Studio name" },
      { name: "tagline", label: "Tagline" },
      { name: "heroHeadline", label: "Hero headline", wide: true, help: "The last word is highlighted in green." },
      { name: "heroSub", label: "Hero sub-text", type: "textarea", wide: true },
      { name: "heroVideoUrl", label: "Hero background video (MP4)", type: "media", accept: "video", wide: true, help: "Keep it under ~6 MB, 1080p, muted loop." },
      { name: "heroPosterUrl", label: "Hero poster image", type: "media", accept: "image", wide: true },
      { name: "announcement", label: "Announcement bar (optional)", wide: true, help: "Shown above the navigation. Leave empty to hide." },
      { name: "bioQuote", label: "About quote", type: "textarea", wide: true },
      { name: "depositRule", label: "Deposit rule banner", type: "textarea", wide: true },
    ],
  },
  {
    title: "Contact",
    fields: [
      { name: "phonePrimary", label: "Phone 1" },
      { name: "phoneSecondary", label: "Phone 2" },
      { name: "whatsapp", label: "WhatsApp number", help: "Digits with country code, e.g. 94752984125" },
      { name: "email", label: "Public e-mail" },
      { name: "location", label: "Location" },
    ],
  },
  {
    title: "Social",
    fields: [
      { name: "instagram", label: "Instagram URL" },
      { name: "facebook", label: "Facebook URL" },
      { name: "youtube", label: "YouTube URL" },
      { name: "tiktok", label: "TikTok URL" },
    ],
  },
  {
    title: "E-mail & SEO",
    fields: [
      { name: "notifyEmail", label: "Booking notifications go to", help: "Mailgun sends every new booking here. Falls back to the public e-mail." },
      { name: "seoDescription", label: "SEO description", type: "textarea", wide: true },
      { name: "ogImageUrl", label: "Social share image (1200×630)", type: "media", accept: "image", wide: true, help: "Leave empty to use the auto-generated card." },
    ],
  },
];

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState(saveSettingsAction, initial);
  return (
    <form action={action} className="grid gap-8">
      {SETTING_GROUPS.map((g) => (
        <fieldset key={g.title} className="glass grid gap-5 rounded-3xl p-6 sm:grid-cols-2 md:p-8">
          <legend className="sr-only">{g.title}</legend>
          <h2 className="label !text-signal sm:col-span-2">{g.title}</h2>
          {g.fields.map((f) => (
            <div key={f.name} className={f.wide ? "sm:col-span-2" : ""}>
              <Label htmlFor={`s-${f.name}`}>{f.label}</Label>
              {f.type === "textarea" ? (
                <textarea id={`s-${f.name}`} name={f.name} defaultValue={values[f.name]} className="field" />
              ) : f.type === "media" ? (
                <MediaField id={`s-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""} accept={f.accept} />
              ) : (
                <input id={`s-${f.name}`} name={f.name} defaultValue={values[f.name]} className="field" />
              )}
              {f.help && <p className="mt-1.5 text-xs text-mute">{f.help}</p>}
            </div>
          ))}
        </fieldset>
      ))}
      <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-full border border-white/10 bg-black/80 px-5 py-3 backdrop-blur">
        <Submit pending={pending}>Save settings</Submit>
        <div className="min-w-0 flex-1">
          <Notice state={state} />
        </div>
      </div>
    </form>
  );
}

/* ───────────── Team & mail tools ───────────── */

export function TeamForm() {
  const [state, action, pending] = useActionState(addTeamMemberAction, initial);
  return (
    <form action={action} className="glass grid gap-4 rounded-3xl p-6 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
      <div>
        <Label htmlFor="tm-name">Name</Label>
        <input id="tm-name" name="name" className="field" />
      </div>
      <div>
        <Label htmlFor="tm-email">E-mail</Label>
        <input id="tm-email" name="email" type="email" required className="field" />
      </div>
      <div>
        <Label htmlFor="tm-role">Role</Label>
        <select id="tm-role" name="role" className="field" defaultValue="editor">
          <option value="editor">editor</option>
          <option value="owner">owner</option>
        </select>
      </div>
      <Submit pending={pending}>Add</Submit>
      <div className="sm:col-span-4">
        <Notice state={state} />
      </div>
    </form>
  );
}

export function TestMailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState(sendTestMailAction, initial);
  return (
    <form action={action} className="glass flex flex-wrap items-end gap-4 rounded-3xl p-6">
      <div className="min-w-[240px] flex-1">
        <Label htmlFor="tt-to">Send a test e-mail to</Label>
        <input id="tt-to" name="to" type="email" defaultValue={defaultTo} className="field" />
      </div>
      <Submit pending={pending}>
        <Send className="h-4 w-4" aria-hidden /> Send test
      </Submit>
      <div className="w-full">
        <Notice state={state} />
      </div>
    </form>
  );
}
