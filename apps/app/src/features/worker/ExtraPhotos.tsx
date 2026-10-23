"use client";

// The extra photos beside the main one (2026-10-23: back for workers, and for admins on a worker's page): up to 2,
// each shrunk on the device -> a ticket -> straight to the bucket -> confirmed as an extra photo. The clean copy
// replaces the staged one by outbox within a minute; while any photo is still being prepared the list re-reads every
// few seconds. Presentational over four calls, so the worker page and the admin page share it.
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { MAX_ADDITIONAL_PHOTOS, type PhotoTicketRequest, type PhotoTicketResponse, type WorkerPhotos } from "@remonta/api-contract";
import { SIGNUP_PHOTO_ACCEPT } from "@/components/ui/form-wizard/fields";
import type { ApiOutcome } from "@/lib/api/outcome";
import { isShownPhoto, photoMessageOf, uploadToPhotoStore } from "./photo";

export interface ExtraPhotosProps {
  title: string;
  hint: string;
  load(): Promise<ApiOutcome<WorkerPhotos>>;
  ticket(body: PhotoTicketRequest): Promise<ApiOutcome<PhotoTicketResponse>>;
  add(uploadId: string): Promise<ApiOutcome<WorkerPhotos>>;
  remove(url: string): Promise<ApiOutcome<WorkerPhotos>>;
  /** Extra photos need a main photo first (the admin may not set one). */
  requireMain?: boolean;
  /** Re-read when this changes (the worker replaced the main photo). */
  refreshKey?: unknown;
  /** After a successful add or remove (the admin page refreshes its photo picker). */
  onChange?: (photos: WorkerPhotos) => void;
}

/** What the add button offers (pure, tested). */
export function addStateOf(photos: WorkerPhotos | null, requireMain: boolean): { canAdd: boolean; reason: string | null } {
  if (!photos) return { canAdd: false, reason: null };
  if (requireMain && !photos.main) return { canAdd: false, reason: "Add a main photo first." };
  if (photos.additional.length >= MAX_ADDITIONAL_PHOTOS) return { canAdd: false, reason: `At most ${MAX_ADDITIONAL_PHOTOS} extra photos.` };
  return { canAdd: true, reason: null };
}

export default function ExtraPhotos({ title, hint, load, ticket, add, remove, requireMain = false, refreshKey, onChange }: ExtraPhotosProps) {
  const [photos, setPhotos] = useState<WorkerPhotos | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const read = useCallback(async () => {
    const r = await loadRef.current();
    if (r.kind === "ok") setPhotos(r.body);
    else setMessage(photoMessageOf(r));
  }, []);

  useEffect(() => {
    void read();
  }, [read, refreshKey]);

  // A staged photo becomes the clean copy within a minute: re-read until every photo can be shown, for up to a minute.
  const preparing = photos?.additional.some((u) => !isShownPhoto(u)) ?? false;
  useEffect(() => {
    if (!preparing) return;
    let tries = 0;
    const t = setInterval(() => {
      if (++tries > 20) clearInterval(t);
      else void read();
    }, 3000);
    return () => clearInterval(t);
  }, [preparing, read]);

  async function upload(file: File) {
    setMessage(null);
    setBusy("Uploading…");
    try {
      const r = await uploadToPhotoStore(file, { ticket, confirm: add, onProgress: (p) => setBusy(`Uploading ${p}%`) });
      if (r.ok) {
        setPhotos(r.body);
        onChange?.(r.body);
      } else setMessage(r.message);
    } finally {
      setBusy(null);
    }
  }

  async function drop(url: string) {
    setMessage(null);
    setBusy("Removing…");
    try {
      const r = await remove(url);
      if (r.kind === "ok") {
        setPhotos(r.body);
        onChange?.(r.body);
      } else setMessage(photoMessageOf(r));
    } finally {
      setBusy(null);
    }
  }

  const state = addStateOf(photos, requireMain);
  return (
    <div className="space-y-3 pt-4 border-t border-gray-200">
      <div>
        <h2 className="text-sm font-semibold font-poppins text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 font-poppins">{hint}</p>
      </div>
      <input
        ref={input}
        type="file"
        accept={SIGNUP_PHOTO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void upload(f);
        }}
      />
      <div className="flex flex-wrap gap-3">
        {photos?.additional.map((url) => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos live on Vercel Blob, outside next/image's domains */}
            {isShownPhoto(url) ? <img src={url} alt="Extra photo" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500 font-poppins text-center px-1">Preparing…</span>}
            <button type="button" disabled={busy !== null} onClick={() => void drop(url)} aria-label="Remove this photo" className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-red-600 shadow disabled:opacity-50">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {state.canAdd && (
          <button type="button" disabled={busy !== null} onClick={() => input.current?.click()} className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-600 font-poppins text-xs hover:border-gray-400 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {busy ?? "Add a photo"}
          </button>
        )}
      </div>
      {state.reason && photos && photos.additional.length < MAX_ADDITIONAL_PHOTOS && <p className="text-xs text-gray-500 font-poppins">{state.reason}</p>}
      <div role="status" aria-live="polite">
        {message && <p className="text-sm font-poppins text-red-600">{message}</p>}
      </div>
    </div>
  );
}
