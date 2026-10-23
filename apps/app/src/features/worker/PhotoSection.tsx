"use client";

// The profile photo page (U2 H2, US-WP-02): the main photo, and up to 2 extra photos below it (back on 2026-10-23;
// ExtraPhotos, their own api entries). A photo goes shrink on the device -> a ticket -> straight to the
// bucket -> confirmed as the profile photo, replacing the current one (the sign-up's flow and
// rules); the clean copy replaces the staged one by outbox within a minute, which the profile
// read picks up on focus. Remove calls its entry.
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { SIGNUP_PHOTO_ACCEPT } from "@/components/ui/form-wizard/fields";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi, type Photos } from "./api";
import ExtraPhotos from "./ExtraPhotos";
import { isShownPhoto, photoMessageOf as messageOf, uploadProfilePhoto } from "./photo";
import { useWorkerProfile } from "./profile";
import { Notice, SectionSkeleton } from "./SectionPage";
import { UNAVAILABLE_MESSAGE } from "./useSection";

type Busy = { kind: "idle" } | { kind: "uploading"; percent: number } | { kind: "processing" } | { kind: "working" };

export default function PhotoSection() {
  const { profile, isLoading, error: readError, patch, reload } = useWorkerProfile();
  const [busy, setBusy] = useState<Busy>({ kind: "idle" });
  const [message, setMessage] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const applied = (r: ApiOutcome<Photos>) => {
    if (r.kind === "ok") {
      patch((p) => ({ ...p, photos: r.body }));
      void reload();
      setMessage(null);
    } else setMessage(messageOf(r));
  };

  async function upload(file: File) {
    setMessage(null);
    setBusy({ kind: "uploading", percent: 0 });
    try {
      const r = await uploadProfilePhoto(file, { onProgress: (percent) => setBusy({ kind: "uploading", percent }), onProcessing: () => setBusy({ kind: "processing" }) });
      if (r.ok) {
        applied({ kind: "ok", body: r.photos });
        if (r.processing) setMessage("Your photo is uploaded and still being prepared. It will appear in a minute.");
      } else setMessage(r.message);
    } finally {
      setBusy({ kind: "idle" });
    }
  }

  async function act(call: () => Promise<ApiOutcome<Photos>>) {
    setBusy({ kind: "working" });
    try {
      applied(await call());
    } finally {
      setBusy({ kind: "idle" });
    }
  }

  const pick = () => input.current?.click();

  const photos = profile?.photos;
  const idle = busy.kind === "idle";

  return (
    <section className="space-y-5">
      <header>
        <h1 className="sr-only">Profile photo</h1>
        <p className="text-sm text-gray-600 font-poppins mt-1">A clear, friendly photo of your face. Clients see it on your profile.</p>
      </header>
      {readError && !profile ? (
        <Notice tone="warn">{readError.kind === "unauthenticated" ? "Your session has ended. Please sign in again." : UNAVAILABLE_MESSAGE}</Notice>
      ) : isLoading || !photos ? (
        <SectionSkeleton />
      ) : (
        <>
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
          <div className="flex items-center gap-5">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- a staged photo is on the bucket, outside next/image's domains */}
              {photos.main && isShownPhoto(photos.main) ? <img src={photos.main} alt="Your profile photo" className="w-full h-full object-cover" /> : <span className="text-sm text-gray-500 font-poppins text-center px-2">{photos.main ? "Preparing your photo…" : "No photo"}</span>}
            </div>
            <div className="space-y-2">
              <button type="button" disabled={!idle} onClick={pick} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0C1628] text-white font-poppins text-sm disabled:opacity-50">
                {busy.kind === "uploading" || busy.kind === "processing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy.kind === "uploading" ? `Uploading ${busy.percent}%` : busy.kind === "processing" ? "Preparing your photo…" : photos.main ? "Replace photo" : "Upload a photo"}
              </button>
              {photos.main && (
                <button type="button" disabled={!idle} onClick={() => void act(() => workerApi.removePhoto(photos.main!))} className="block text-sm font-poppins text-red-600 hover:underline disabled:opacity-50">
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div role="status" aria-live="polite">
            {message && <p className="text-sm font-poppins text-red-600">{message}</p>}
          </div>

          <ExtraPhotos
            title="More photos"
            hint="Up to 2 more photos, such as you at work or a hobby. Clients may see them on your profile."
            load={() => workerApi.getPhotos()}
            ticket={(body) => workerApi.createPhotoTicket(body)}
            add={(uploadId) => workerApi.addAdditionalPhoto({ uploadId })}
            remove={(url) => workerApi.removeAdditionalPhoto(url)}
            refreshKey={photos.main}
          />
        </>
      )}
    </section>
  );
}
