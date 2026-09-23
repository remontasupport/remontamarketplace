// U7 re-export shim. The implementation moved to @remonta/schemas so both
// apps and a future mobile client share one contract (T2=A). This file keeps
// existing imports working unchanged; it is deleted in a later unit once call
// sites point at the package directly.
export * from '@remonta/schemas/types/workerRegistration'
