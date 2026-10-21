# Profile completion: questions (2026-10-21)

The findings are in `aidlc-docs/inception/review/profile-completion-audit.md` (F1-F9) and the proposed improvements
I1-I6. Fill in each `[Answer]:` with a letter, or X and your own words.

## Question 1
Which improvements should this cycle do?

A) All six, in one unit per area (I1+I2+I3 the completion entry and the screens; I4 the stored flags; I5 the apply
rule; I6 the service table) (recommended)

B) Only what the worker sees: I1, I2, I3, I5 (the stored flags and the service table later)

C) Only the backend: I4 and I6 (the screens later)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2
What should the percent on the My Profile badge count?

A) Only the My Profile pages (the 18 links under Personal, Professional and Additional Information), so 100 % means
every My Profile link is ticked (recommended)

B) Everything a client sees on the profile (My Profile plus the services and the service area), as today but without
the double-counted language

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
Which My Profile pages must be filled for a page to count as "complete"? Today some pages are optional in practice
(Cultural Background, Religion, Interests, Preferences, Personality).

A) Every one of the 18 (as the ticks show today)

B) The required ones only: Name, Profile Photo, Bio, Address, Date of Birth, Gender, Language, Experience, Work
History, Education, Preferred Hours, Vehicle Access; the rest are ticked when filled but do not hold the percent back

X) Other (please list after [Answer]: tag below)

[Answer]: b

## Question 4
The home checklist's items. Today: Account Details, Compliance, Trainings, My Services.

A) The menu's groups: **My Profile**, **Services** (services chosen, their documents, the service area),
**Compliance** (mandatory documents and trainings together), each linking to its first unfinished page
(recommended: matches the sidebar and the tour)

B) Keep the four, renamed to the menu's words (My Profile, Compliance, Trainings, Services)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5
"Account Details" (or "My Profile" after Q4) needs a suburb. Which one?

A) The private home address (Address page in My Profile) (recommended: the item is about My Profile)

B) The service area (Services)

X) Other (please describe after [Answer]: tag below)

[Answer]: Private home address can be excluded

## Question 6
Applying for a job from the profile page is blocked until Experience, Fun Fact, Languages, Interests and Support &
Activities are filled, while the job slider lets the worker apply (a decision of 2026-09-23 said apply is no longer
gated). Which is right?

A) Not gated anywhere: remove the profile page's block (recommended, per the 2026-09-23 decision)

B) Gated everywhere, by the same rule (please say which sections after [Answer]:)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 7
When the release with these changes ships, should the congratulations pop-up (shown once at 100 %) appear again for
workers whose completion changes under the new rules?

A) No: shown once per worker, as today (it is remembered in the browser)

B) Yes, once more under the new rules

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 8
Should these changes ship with the held `feat/account-app` release (the tour, the sidebar, PR #57), or after it?

A) After it: release `feat/account-app` first; this work follows as its own release (recommended: smaller releases,
and the checklist the tour points at keeps working meanwhile)

B) With it, in the same release

X) Other (please describe after [Answer]: tag below)

[Answer]: a
