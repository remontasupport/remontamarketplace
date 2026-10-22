# U2 `tools-app`: domain entities (app side)

## A1 `features/worker/serviceTools.ts` (pure, tested in node)

```ts
toolLabelsOf(service: ToolService): string[]                         // the field's options, list order
fieldValueOf(t: ServiceTools): string[]                              // UR-4 load: labels (stale ids dropped) then own tools
bodyOf(service, value: string[]): ServiceToolsBody                   // UR-4 save: listed labels -> ids; the rest -> otherTools
addOwnTool(service, value, typed): { value: string[]; refused?: string }   // UR-3: label -> tick it; repeat -> nothing; 5 / 60 limits
hasToolsScreen(serviceTitle | categoryId): boolean                   // UR-1 (isToolService on the slug)
```
Plus the api calls on the existing `workerApi` (`getServiceTools`, `putServiceTools`) returning `ApiOutcome`.

## A2 `MultiSelectField` (shared, `components/ui/form-wizard/sectionFields.tsx`)

Two optional props, no change for current users: `maxOwn?: number` (Add disabled at that many own values) and
`ownMaxLength?: number` (the box's `maxLength`); and `onAddOwn?(typed): string[] | null` so a page can map a typed
label to its option (UR-3). Without them it behaves exactly as today (Languages, Interests, Other areas).

## A3 Admin filters (`features/admin-search/query.ts`)

`AdminFilters.tools: string[]` (ids); `toQuery` sends `tools` when non-empty; `filtersFromURL` / `urlFromFilters` carry
it; the empty default. Labels come from `@remonta/schemas/data/serviceTools`.

## A4 Admin worker read (`lib/api/admin.ts`)

`getWorkerServices(workerId)` through the existing admin client (token, one 401 retry), `ApiOutcome<AdminWorkerServices>`.

## A5 The sign-up field definition

`workerRegistration.ts`'s services field gains
`notes: [{ whenAny: ['cleaning-services', 'home-yard-maintenance'], text: '...' }]`; the form engine passes `notes`
through untouched (no rule), `FieldSlot` hands them to `ServicesField`, which shows a note while any of its ids is
ticked.
