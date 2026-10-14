// The list rows whose delete icon removes the stored row through apps/api at once (user, 2026-10-14: the
// Experience page's delete, after a confirm). Keyed by the section's name and its list field; a section not
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
  /** The api call; its answer is the list as stored after the delete. */
  remove: (row: SectionValues) => Promise<ApiOutcome<unknown>>;
}

type Domain = Profile["sections"]["experience"][number]["domain"];

export const ROW_DELETES: Readonly<Record<string, RowDelete>> = {
  experience: {
    field: "domains",
    isStored: (row, profile) => profile.sections.experience.some((e) => e.domain === row.domain),
    describe: (row) => EXPERIENCE_DOMAINS.find((d) => d.domain === row.domain)?.label ?? "this area",
    remove: (row) => workerApi.deleteExperience(row.domain as Domain),
  },
};
