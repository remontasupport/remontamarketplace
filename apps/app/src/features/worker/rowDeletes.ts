// The list rows whose delete icon removes the stored row through apps/api at once (user, 2026-10-14: the
// Experience page's delete, after a confirm; then Work History and Education). Keyed by the section's name and its list field; a section not
// listed here keeps the plain behaviour (the row leaves the form, the next Save stores the list).
import type { Profile } from "@remonta/api-contract";
import type { SectionValues } from "@remonta/form-engine";
import { EXPERIENCE_DOMAINS } from "@remonta/schemas/data/experienceAreas";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi } from "./api";

export interface RowDelete {
  /** The list field the icon sits on. */
  field: string;
  /** The row is stored (the api has something to delete); a row added on the page and never saved is not. */
  isStored: (row: SectionValues, profile: Profile) => boolean;
  /** How the confirm names the row. */
  describe: (row: SectionValues) => string;
  /** The dialog's noun: "area", "job". */
  noun: string;
  /** The api call; its answer is the list as stored after the delete. */
  remove: (row: SectionValues) => Promise<ApiOutcome<unknown>>;
}

type Domain = Profile["sections"]["experience"][number]["domain"];

/** A 404 on a row delete means the row is not there (deleted in another tab, or never the caller's): it is gone either way. */
const goneIsDone = async (r: Promise<ApiOutcome<unknown>>): Promise<ApiOutcome<unknown>> => {
  const out = await r;
  return out.kind === "failed" && out.status === 404 ? { kind: "ok", body: null } : out;
};

export const ROW_DELETES: Readonly<Record<string, RowDelete>> = {
  experience: {
    field: "domains",
    noun: "area",
    isStored: (row, profile) => profile.sections.experience.some((e) => e.domain === row.domain),
    describe: (row) => EXPERIENCE_DOMAINS.find((d) => d.domain === row.domain)?.label ?? "this area",
    remove: (row) => workerApi.deleteExperience(row.domain as Domain),
  },
  "work-history": {
    field: "entries",
    noun: "job",
    // The row's id (the list's rowKey) is set only on a stored job; a job added on the page has none.
    isStored: (row, profile) => typeof row.id === "string" && profile.sections.jobHistory.some((e) => e.id === row.id),
    describe: (row) => (row.jobTitle ? `"${String(row.jobTitle)}"${row.company ? ` at ${String(row.company)}` : ""}` : "This job"),
    remove: (row) => goneIsDone(workerApi.deleteJobHistoryEntry(String(row.id))),
  },
  education: {
    field: "entries",
    noun: "qualification",
    isStored: (row, profile) => typeof row.id === "string" && profile.sections.education.some((e) => e.id === row.id),
    describe: (row) => (row.qualification ? `"${String(row.qualification)}"${row.institution ? ` from ${String(row.institution)}` : ""}` : "This qualification"),
    remove: (row) => goneIsDone(workerApi.deleteEducationEntry(String(row.id))),
  },
};
