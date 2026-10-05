// The browser transport for the sign-up photo (U3): a multipart form POST straight to
// storage with the signed fields the api issued, the file last. XMLHttpRequest, not
// fetch, because only it reports upload progress. No custom headers, so no CORS
// preflight; the response body is ignored. Implements the engine's Uploader port.
import { UploadError, type Uploader } from "@remonta/form-engine";

export const xhrUploader: Uploader = {
  upload(file, target, { onProgress, signal } = {}) {
    return new Promise<void>((resolve, reject) => {
      const form = new FormData();
      for (const [k, v] of Object.entries(target.fields)) form.append(k, v);
      form.append(target.fileField, file, (file as File).name || "photo.jpg");

      const xhr = new XMLHttpRequest();
      xhr.open(target.method, target.url, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new UploadError(xhr.status, xhr.status === 403));
      };
      xhr.onerror = () => reject(new UploadError(0, false, "network error"));
      xhr.onabort = () => reject(signal?.reason instanceof Error ? signal.reason : new Error("upload aborted"));
      xhr.ontimeout = () => reject(new UploadError(0, false, "timeout"));
      xhr.timeout = 120_000;
      if (signal) {
        if (signal.aborted) return reject(signal.reason instanceof Error ? signal.reason : new Error("upload aborted"));
        signal.addEventListener("abort", () => xhr.abort(), { once: true });
      }
      xhr.send(form);
    });
  },
};
