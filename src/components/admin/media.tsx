"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Film, ImageIcon, Images, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { deleteMediaAction } from "@/app/admin/actions";

export type Accept = "image" | "video" | "any";

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  mime: string;
  kind: string;
  size: number;
  createdAt: string;
}

const MIME_BY_ACCEPT: Record<Accept, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  any: "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime",
};

export const isVideoUrl = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);
export const isImageUrl = (u: string) => /\.(jpe?g|png|webp|avif|gif)(\?|$)/i.test(u) || /images\.pexels\.com/.test(u);

export function formatBytes(n: number) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n > 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/** Direct-to-Supabase-Storage upload using a server-signed URL (with real progress for large videos). */
export async function uploadFile(file: File, onProgress?: (pct: number) => void): Promise<MediaItem> {
  const mime = file.type || (file.name.endsWith(".mov") ? "video/quicktime" : "");
  const sign = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mime, size: file.size, name: file.name }),
  });
  const signed = await sign.json().catch(() => ({}));
  if (!sign.ok || !signed.ok) throw new Error(signed.error ?? "Could not start upload.");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signed.signedUrl);
    xhr.setRequestHeader("apikey", signed.anonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("content-type", mime);
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Storage rejected the file (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });

  const rec = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: signed.path, name: file.name, mime, size: file.size }),
  });
  const json = await rec.json().catch(() => ({}));
  if (!rec.ok || !json.ok) throw new Error(json.error ?? "Uploaded, but could not save to the library.");
  return json.item as MediaItem;
}

interface UploadJob {
  key: string;
  name: string;
  pct: number;
  error?: string;
  done?: boolean;
}

/** Drag-and-drop multi-file uploader with per-file progress. */
export function Uploader({ accept = "any", onUploaded, compact = false }: { accept?: Accept; onUploaded: (items: MediaItem[]) => void; compact?: boolean }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const run = useCallback(
    async (files: File[]) => {
      const created: MediaItem[] = [];
      const started = files.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, pct: 0 }) as UploadJob);
      setJobs((j) => [...started, ...j].slice(0, 8));
      await Promise.all(
        files.map(async (file, i) => {
          const key = started[i].key;
          try {
            const item = await uploadFile(file, (pct) => setJobs((j) => j.map((x) => (x.key === key ? { ...x, pct } : x))));
            created.push(item);
            setJobs((j) => j.map((x) => (x.key === key ? { ...x, pct: 100, done: true } : x)));
          } catch (e) {
            setJobs((j) => j.map((x) => (x.key === key ? { ...x, error: e instanceof Error ? e.message : "Failed" } : x)));
          }
        }),
      );
      if (created.length) onUploaded(created);
    },
    [onUploaded],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          run(Array.from(e.dataTransfer.files));
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-center transition-colors ${
          compact ? "px-4 py-5" : "px-6 py-10"
        } ${drag ? "border-signal bg-signal/10" : "border-white/20 bg-white/[0.02] hover:border-white/40"}`}
      >
        <UploadCloud className="h-7 w-7 text-signal" aria-hidden />
        <p className="text-sm font-semibold text-silver">Drop {accept === "video" ? "videos" : accept === "image" ? "images" : "images or videos"} here, or click to browse</p>
        <p className="text-xs text-mute">JPG · PNG · WebP · AVIF · GIF · MP4 · WebM · MOV</p>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={MIME_BY_ACCEPT[accept]}
          onChange={(e) => {
            if (e.target.files?.length) run(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 grid gap-2" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-silver">{j.name}</span>
                <span className={j.error ? "text-red-300" : j.done ? "text-signal" : "text-mute"}>{j.error ? "Failed" : j.done ? "Done" : `${j.pct}%`}</span>
              </div>
              {!j.done && !j.error && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-signal transition-[width]" style={{ width: `${j.pct}%` }} />
                </div>
              )}
              {j.error && <p className="mt-1 text-red-300">{j.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumb({ url, className = "" }: { url: string; className?: string }) {
  if (isVideoUrl(url)) {
    return <video src={`${url}#t=0.5`} muted playsInline preload="metadata" className={`object-cover ${className}`} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" decoding="async" className={`object-cover ${className}`} />;
}

/** Modal that lets editors pick from the library or upload new files. */
export function MediaPicker({
  accept,
  multiple,
  onClose,
  onPick,
}: {
  accept: Accept;
  multiple?: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/media${accept === "any" ? "" : `?kind=${accept}`}`)
      .then((r) => r.json())
      .then((j) => alive && (j.ok ? setItems(j.items) : setError(j.error ?? "Could not load the library.")))
      .catch(() => alive && setError("Could not load the library."));
    return () => {
      alive = false;
    };
  }, [accept]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggle = (url: string) =>
    setSelected((s) => (multiple ? (s.includes(url) ? s.filter((x) => x !== url) : [...s, url]) : [url]));

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="glass flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em]">
            <Images className="h-4 w-4 text-signal" aria-hidden /> Media library
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          <Uploader
            accept={accept}
            compact
            onUploaded={(created) => {
              setItems((cur) => [...created, ...(cur ?? [])]);
              setSelected((s) => (multiple ? [...s, ...created.map((c) => c.url)] : [created[0].url]));
            }}
          />
          {error && <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {items === null && !error && (
            <p className="mt-6 flex items-center gap-2 text-sm text-mute">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          )}
          {items && items.length === 0 && <p className="mt-6 text-center text-sm text-mute">No files yet — upload your first one above.</p>}
          {items && items.length > 0 && (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((m) => {
                const on = selected.includes(m.url);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.url)}
                      onDoubleClick={() => !multiple && onPick([m.url])}
                      aria-pressed={on}
                      className={`group relative block aspect-square w-full overflow-hidden rounded-xl border-2 ${on ? "border-signal" : "border-transparent hover:border-white/30"}`}
                    >
                      <Thumb url={m.url} className="h-full w-full" />
                      {m.kind === "video" && <Film className="absolute left-2 top-2 h-4 w-4 drop-shadow" aria-hidden />}
                      {on && (
                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-signal text-black">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-2 pb-1.5 pt-6 text-left text-[10px] text-silver">{m.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <span className="text-xs text-mute">{selected.length} selected</span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost !px-5 !py-2.5" onClick={onClose}>
              Cancel
            </button>
            <button type="button" disabled={!selected.length} className="btn btn-primary !px-5 !py-2.5 disabled:opacity-50" onClick={() => onPick(selected)}>
              Use {multiple ? "selected" : "file"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single media URL: paste a link, pick from the library, or upload. */
export function MediaField({ name, defaultValue, id, accept = "any" }: { name: string; defaultValue: string; id: string; accept?: Accept }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex gap-2">
        <input id={id} name={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://… or choose from library" className="field" />
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost !px-5 !py-3 whitespace-nowrap">
          <UploadCloud className="h-4 w-4" aria-hidden /> Library
        </button>
      </div>
      {value && (isImageUrl(value) || isVideoUrl(value)) && (
        <div className="relative mt-2 inline-block">
          <Thumb url={value} className="h-24 w-40 rounded-lg border border-white/10" />
          <button type="button" aria-label="Remove" onClick={() => setValue("")} className="absolute -right-2 -top-2 rounded-full bg-black p-1 ring-1 ring-white/30 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {open && (
        <MediaPicker
          accept={accept}
          onClose={() => setOpen(false)}
          onPick={([url]) => {
            setValue(url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Multi-file gallery stored as a JSON array in a hidden input. */
export function GalleryField({ name, defaultValue }: { name: string; defaultValue: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);
  const move = (i: number, d: number) =>
    setUrls((u) => {
      const next = [...u];
      const j = i + d;
      if (j < 0 || j >= next.length) return u;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {urls.map((u, i) => (
          <li key={`${u}-${i}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
            <Thumb url={u} className="h-full w-full" />
            {isVideoUrl(u) && <Film className="absolute left-2 top-2 h-4 w-4" aria-hidden />}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} className="px-2 text-xs hover:text-signal">
                ←
              </button>
              <button type="button" aria-label="Remove" onClick={() => setUrls((x) => x.filter((_, k) => k !== i))} className="px-1 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button type="button" aria-label="Move later" onClick={() => move(i, 1)} className="px-2 text-xs hover:text-signal">
                →
              </button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => setOpen(true)} className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 text-xs text-mute transition-colors hover:border-signal hover:text-signal">
            <Plus className="h-5 w-5" aria-hidden /> Add media
          </button>
        </li>
      </ul>
      {open && (
        <MediaPicker
          accept="any"
          multiple
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            setUrls((u) => [...u, ...picked.filter((p) => !u.includes(p))]);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Full media library page. */
export function MediaLibrary({ initial, configured }: { initial: MediaItem[]; configured: boolean }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const shown = items.filter((i) => filter === "all" || i.kind === filter);
  const [copied, setCopied] = useState("");

  return (
    <div>
      {!configured && (
        <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          Uploads need <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code>. Until then you can still paste external URLs in any media field.
        </div>
      )}
      <Uploader onUploaded={(created) => setItems((cur) => [...created, ...cur])} />
      <div className="mb-4 mt-8 flex items-center gap-2">
        {(["all", "image", "video"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest ${filter === f ? "border-signal bg-signal text-black" : "border-white/15 text-mute hover:text-white"}`}
          >
            {f === "image" ? <ImageIcon className="h-3 w-3" /> : f === "video" ? <Film className="h-3 w-3" /> : null}
            {f}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-mute">{shown.length} files</span>
      </div>
      {shown.length === 0 && <p className="rounded-3xl border border-white/10 p-10 text-center text-mute">Nothing here yet.</p>}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((m) => (
          <li key={m.id} className="glass overflow-hidden rounded-2xl">
            <div className="relative aspect-video bg-black">
              <Thumb url={m.url} className="h-full w-full" />
              {m.kind === "video" && <Film className="absolute left-2 top-2 h-4 w-4" aria-hidden />}
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-semibold text-silver" title={m.name}>
                {m.name}
              </p>
              <p className="font-mono text-[10px] text-mute">
                {formatBytes(m.size)} · {new Date(m.createdAt).toLocaleDateString()}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(m.url).catch(() => {});
                    setCopied(m.id);
                    setTimeout(() => setCopied(""), 1500);
                  }}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] hover:border-signal hover:text-signal"
                >
                  {copied === m.id ? "Copied!" : "Copy URL"}
                </button>
                <form
                  action={deleteMediaAction}
                  onSubmit={(e) => {
                    if (!confirm("Delete this file from storage? Pages using it will show a broken link.")) e.preventDefault();
                    else setItems((cur) => cur.filter((x) => x.id !== m.id));
                  }}
                  className="ml-auto"
                >
                  <input type="hidden" name="id" value={m.id} />
                  <button aria-label={`Delete ${m.name}`} className="rounded-full p-1.5 text-mute hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
