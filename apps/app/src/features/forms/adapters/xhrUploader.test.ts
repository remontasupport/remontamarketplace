import { describe, expect, it, vi } from "vitest";
import { UploadError, type UploadTarget } from "@remonta/form-engine";
import { xhrUploader } from "./xhrUploader";

/** A scripted XMLHttpRequest: records what was sent, then answers as told. */
class FakeXhr {
  static last: FakeXhr | undefined;
  static script: { status: number; progress?: [number, number][]; error?: "network" | "timeout" } = { status: 201 };
  status = 0;
  timeout = 0;
  upload = { onprogress: null as null | ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) };
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  onabort: null | (() => void) = null;
  ontimeout: null | (() => void) = null;
  opened: [string, string] | undefined;
  sent: FormData | undefined;
  aborted = false;
  open(method: string, url: string) {
    this.opened = [method, url];
  }
  send(body: FormData) {
    FakeXhr.last = this;
    this.sent = body;
    queueMicrotask(() => {
      if (this.aborted) return;
      for (const [loaded, total] of FakeXhr.script.progress ?? []) this.upload.onprogress?.({ lengthComputable: true, loaded, total });
      if (FakeXhr.script.error === "network") return this.onerror?.();
      if (FakeXhr.script.error === "timeout") return this.ontimeout?.();
      this.status = FakeXhr.script.status;
      this.onload?.();
    });
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

const target: UploadTarget = { url: "https://storage.example/bucket/", method: "POST", fields: { key: "staging/x", policy: "p", "x-goog-signature": "s" }, fileField: "file" };
const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "me.jpg", { type: "image/jpeg" });

describe("xhrUploader", () => {
  vi.stubGlobal("XMLHttpRequest", FakeXhr);

  it("POSTs the signed fields first and the file last, reports progress, resolves on 2xx", async () => {
    FakeXhr.script = { status: 201, progress: [[1, 3], [3, 3]] };
    const progress: [number, number][] = [];
    await xhrUploader.upload(file, target, { onProgress: (s, t) => progress.push([s, t]) });
    const x = FakeXhr.last!;
    expect(x.opened).toEqual(["POST", target.url]);
    const entries = [...x.sent!.entries()].map(([k, v]) => [k, v instanceof File ? `file:${v.name}` : v]);
    expect(entries).toEqual([["key", "staging/x"], ["policy", "p"], ["x-goog-signature", "s"], ["file", "file:me.jpg"]]);
    expect(progress).toEqual([[1, 3], [3, 3]]);
  });

  it("rejects with policyRefused on 403 and plain UploadError on other statuses, network errors and timeouts", async () => {
    FakeXhr.script = { status: 403 };
    await expect(xhrUploader.upload(file, target, {})).rejects.toMatchObject({ name: "UploadError", status: 403, policyRefused: true });
    FakeXhr.script = { status: 500 };
    await expect(xhrUploader.upload(file, target, {})).rejects.toMatchObject({ status: 500, policyRefused: false });
    FakeXhr.script = { status: 0, error: "network" };
    await expect(xhrUploader.upload(file, target, {})).rejects.toBeInstanceOf(UploadError);
    FakeXhr.script = { status: 0, error: "timeout" };
    await expect(xhrUploader.upload(file, target, {})).rejects.toBeInstanceOf(UploadError);
  });

  it("aborts the request when the signal fires, rejecting with the signal's reason", async () => {
    FakeXhr.script = { status: 201 };
    const c = new AbortController();
    const p = xhrUploader.upload(file, target, { signal: c.signal });
    c.abort(new Error("new pick"));
    await expect(p).rejects.toThrow("new pick");
    expect(FakeXhr.last!.aborted).toBe(true);
  });
});
