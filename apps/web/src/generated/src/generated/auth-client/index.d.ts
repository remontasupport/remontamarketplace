
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Account
 * 
 */
export type Account = $Result.DefaultSelection<Prisma.$AccountPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model VerificationToken
 * 
 */
export type VerificationToken = $Result.DefaultSelection<Prisma.$VerificationTokenPayload>
/**
 * Model WorkerProfile
 * 
 */
export type WorkerProfile = $Result.DefaultSelection<Prisma.$WorkerProfilePayload>
/**
 * Model VerificationRequirement
 * 
 */
export type VerificationRequirement = $Result.DefaultSelection<Prisma.$VerificationRequirementPayload>
/**
 * Model ClientProfile
 * 
 */
export type ClientProfile = $Result.DefaultSelection<Prisma.$ClientProfilePayload>
/**
 * Model CoordinatorProfile
 * 
 */
export type CoordinatorProfile = $Result.DefaultSelection<Prisma.$CoordinatorProfilePayload>
/**
 * Model AuditLog
 * 
 */
export type AuditLog = $Result.DefaultSelection<Prisma.$AuditLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  WORKER: 'WORKER',
  CLIENT: 'CLIENT',
  COORDINATOR: 'COORDINATOR'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const AccountStatus: {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOCKED: 'LOCKED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION'
};

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]


export const VerificationStatus: {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus]


export const RequirementStatus: {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

export type RequirementStatus = (typeof RequirementStatus)[keyof typeof RequirementStatus]


export const DocumentCategory: {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  WORKING_RIGHTS: 'WORKING_RIGHTS'
};

export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory]


export const AuditAction: {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS: 'PASSWORD_RESET_SUCCESS',
  EMAIL_CHANGE: 'EMAIL_CHANGE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  ROLE_CHANGE: 'ROLE_CHANGE'
};

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type AccountStatus = $Enums.AccountStatus

export const AccountStatus: typeof $Enums.AccountStatus

export type VerificationStatus = $Enums.VerificationStatus

export const VerificationStatus: typeof $Enums.VerificationStatus

export type RequirementStatus = $Enums.RequirementStatus

export const RequirementStatus: typeof $Enums.RequirementStatus

export type DocumentCategory = $Enums.DocumentCategory

export const DocumentCategory: typeof $Enums.DocumentCategory

export type AuditAction = $Enums.AuditAction

export const AuditAction: typeof $Enums.AuditAction

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.account`: Exposes CRUD operations for the **Account** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Accounts
    * const accounts = await prisma.account.findMany()
    * ```
    */
  get account(): Prisma.AccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationToken`: Exposes CRUD operations for the **VerificationToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationTokens
    * const verificationTokens = await prisma.verificationToken.findMany()
    * ```
    */
  get verificationToken(): Prisma.VerificationTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.workerProfile`: Exposes CRUD operations for the **WorkerProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WorkerProfiles
    * const workerProfiles = await prisma.workerProfile.findMany()
    * ```
    */
  get workerProfile(): Prisma.WorkerProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationRequirement`: Exposes CRUD operations for the **VerificationRequirement** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationRequirements
    * const verificationRequirements = await prisma.verificationRequirement.findMany()
    * ```
    */
  get verificationRequirement(): Prisma.VerificationRequirementDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.clientProfile`: Exposes CRUD operations for the **ClientProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ClientProfiles
    * const clientProfiles = await prisma.clientProfile.findMany()
    * ```
    */
  get clientProfile(): Prisma.ClientProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.coordinatorProfile`: Exposes CRUD operations for the **CoordinatorProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CoordinatorProfiles
    * const coordinatorProfiles = await prisma.coordinatorProfile.findMany()
    * ```
    */
  get coordinatorProfile(): Prisma.CoordinatorProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditLogs
    * const auditLogs = await prisma.auditLog.findMany()
    * ```
    */
  get auditLog(): Prisma.AuditLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.2
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Account: 'Account',
    Session: 'Session',
    VerificationToken: 'VerificationToken',
    WorkerProfile: 'WorkerProfile',
    VerificationRequirement: 'VerificationRequirement',
    ClientProfile: 'ClientProfile',
    CoordinatorProfile: 'CoordinatorProfile',
    AuditLog: 'AuditLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "account" | "session" | "verificationToken" | "workerProfile" | "verificationRequirement" | "clientProfile" | "coordinatorProfile" | "auditLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Account: {
        payload: Prisma.$AccountPayload<ExtArgs>
        fields: Prisma.AccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findFirst: {
            args: Prisma.AccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findMany: {
            args: Prisma.AccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          create: {
            args: Prisma.AccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          createMany: {
            args: Prisma.AccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          delete: {
            args: Prisma.AccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          update: {
            args: Prisma.AccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          deleteMany: {
            args: Prisma.AccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          upsert: {
            args: Prisma.AccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          aggregate: {
            args: Prisma.AccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAccount>
          }
          groupBy: {
            args: Prisma.AccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<AccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.AccountCountArgs<ExtArgs>
            result: $Utils.Optional<AccountCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      VerificationToken: {
        payload: Prisma.$VerificationTokenPayload<ExtArgs>
        fields: Prisma.VerificationTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findFirst: {
            args: Prisma.VerificationTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findMany: {
            args: Prisma.VerificationTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          create: {
            args: Prisma.VerificationTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          createMany: {
            args: Prisma.VerificationTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          delete: {
            args: Prisma.VerificationTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          update: {
            args: Prisma.VerificationTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          deleteMany: {
            args: Prisma.VerificationTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          upsert: {
            args: Prisma.VerificationTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          aggregate: {
            args: Prisma.VerificationTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationToken>
          }
          groupBy: {
            args: Prisma.VerificationTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationTokenCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenCountAggregateOutputType> | number
          }
        }
      }
      WorkerProfile: {
        payload: Prisma.$WorkerProfilePayload<ExtArgs>
        fields: Prisma.WorkerProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WorkerProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WorkerProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          findFirst: {
            args: Prisma.WorkerProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WorkerProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          findMany: {
            args: Prisma.WorkerProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>[]
          }
          create: {
            args: Prisma.WorkerProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          createMany: {
            args: Prisma.WorkerProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WorkerProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>[]
          }
          delete: {
            args: Prisma.WorkerProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          update: {
            args: Prisma.WorkerProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          deleteMany: {
            args: Prisma.WorkerProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WorkerProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WorkerProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>[]
          }
          upsert: {
            args: Prisma.WorkerProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WorkerProfilePayload>
          }
          aggregate: {
            args: Prisma.WorkerProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWorkerProfile>
          }
          groupBy: {
            args: Prisma.WorkerProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<WorkerProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.WorkerProfileCountArgs<ExtArgs>
            result: $Utils.Optional<WorkerProfileCountAggregateOutputType> | number
          }
        }
      }
      VerificationRequirement: {
        payload: Prisma.$VerificationRequirementPayload<ExtArgs>
        fields: Prisma.VerificationRequirementFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationRequirementFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationRequirementFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          findFirst: {
            args: Prisma.VerificationRequirementFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationRequirementFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          findMany: {
            args: Prisma.VerificationRequirementFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>[]
          }
          create: {
            args: Prisma.VerificationRequirementCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          createMany: {
            args: Prisma.VerificationRequirementCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationRequirementCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>[]
          }
          delete: {
            args: Prisma.VerificationRequirementDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          update: {
            args: Prisma.VerificationRequirementUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          deleteMany: {
            args: Prisma.VerificationRequirementDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationRequirementUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationRequirementUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>[]
          }
          upsert: {
            args: Prisma.VerificationRequirementUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationRequirementPayload>
          }
          aggregate: {
            args: Prisma.VerificationRequirementAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationRequirement>
          }
          groupBy: {
            args: Prisma.VerificationRequirementGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationRequirementGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationRequirementCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationRequirementCountAggregateOutputType> | number
          }
        }
      }
      ClientProfile: {
        payload: Prisma.$ClientProfilePayload<ExtArgs>
        fields: Prisma.ClientProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ClientProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ClientProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          findFirst: {
            args: Prisma.ClientProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ClientProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          findMany: {
            args: Prisma.ClientProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>[]
          }
          create: {
            args: Prisma.ClientProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          createMany: {
            args: Prisma.ClientProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ClientProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>[]
          }
          delete: {
            args: Prisma.ClientProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          update: {
            args: Prisma.ClientProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          deleteMany: {
            args: Prisma.ClientProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ClientProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ClientProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>[]
          }
          upsert: {
            args: Prisma.ClientProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClientProfilePayload>
          }
          aggregate: {
            args: Prisma.ClientProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateClientProfile>
          }
          groupBy: {
            args: Prisma.ClientProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<ClientProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.ClientProfileCountArgs<ExtArgs>
            result: $Utils.Optional<ClientProfileCountAggregateOutputType> | number
          }
        }
      }
      CoordinatorProfile: {
        payload: Prisma.$CoordinatorProfilePayload<ExtArgs>
        fields: Prisma.CoordinatorProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CoordinatorProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CoordinatorProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          findFirst: {
            args: Prisma.CoordinatorProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CoordinatorProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          findMany: {
            args: Prisma.CoordinatorProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>[]
          }
          create: {
            args: Prisma.CoordinatorProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          createMany: {
            args: Prisma.CoordinatorProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CoordinatorProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>[]
          }
          delete: {
            args: Prisma.CoordinatorProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          update: {
            args: Prisma.CoordinatorProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          deleteMany: {
            args: Prisma.CoordinatorProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CoordinatorProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CoordinatorProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>[]
          }
          upsert: {
            args: Prisma.CoordinatorProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoordinatorProfilePayload>
          }
          aggregate: {
            args: Prisma.CoordinatorProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCoordinatorProfile>
          }
          groupBy: {
            args: Prisma.CoordinatorProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<CoordinatorProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.CoordinatorProfileCountArgs<ExtArgs>
            result: $Utils.Optional<CoordinatorProfileCountAggregateOutputType> | number
          }
        }
      }
      AuditLog: {
        payload: Prisma.$AuditLogPayload<ExtArgs>
        fields: Prisma.AuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findFirst: {
            args: Prisma.AuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findMany: {
            args: Prisma.AuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          create: {
            args: Prisma.AuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          createMany: {
            args: Prisma.AuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          delete: {
            args: Prisma.AuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          update: {
            args: Prisma.AuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          deleteMany: {
            args: Prisma.AuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          upsert: {
            args: Prisma.AuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          aggregate: {
            args: Prisma.AuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditLog>
          }
          groupBy: {
            args: Prisma.AuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<AuditLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    account?: AccountOmit
    session?: SessionOmit
    verificationToken?: VerificationTokenOmit
    workerProfile?: WorkerProfileOmit
    verificationRequirement?: VerificationRequirementOmit
    clientProfile?: ClientProfileOmit
    coordinatorProfile?: CoordinatorProfileOmit
    auditLog?: AuditLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    accounts: number
    sessions: number
    auditLogs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | UserCountOutputTypeCountAccountsArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
    auditLogs?: boolean | UserCountOutputTypeCountAuditLogsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAuditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
  }


  /**
   * Count Type WorkerProfileCountOutputType
   */

  export type WorkerProfileCountOutputType = {
    verificationRequirements: number
  }

  export type WorkerProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    verificationRequirements?: boolean | WorkerProfileCountOutputTypeCountVerificationRequirementsArgs
  }

  // Custom InputTypes
  /**
   * WorkerProfileCountOutputType without action
   */
  export type WorkerProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfileCountOutputType
     */
    select?: WorkerProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * WorkerProfileCountOutputType without action
   */
  export type WorkerProfileCountOutputTypeCountVerificationRequirementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationRequirementWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    failedLoginAttempts: number | null
  }

  export type UserSumAggregateOutputType = {
    failedLoginAttempts: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    role: $Enums.UserRole | null
    status: $Enums.AccountStatus | null
    resetPasswordToken: string | null
    resetPasswordExpires: Date | null
    failedLoginAttempts: number | null
    accountLockedUntil: Date | null
    lastLoginAt: Date | null
    lastLoginIp: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    role: $Enums.UserRole | null
    status: $Enums.AccountStatus | null
    resetPasswordToken: string | null
    resetPasswordExpires: Date | null
    failedLoginAttempts: number | null
    accountLockedUntil: Date | null
    lastLoginAt: Date | null
    lastLoginIp: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    role: number
    status: number
    resetPasswordToken: number
    resetPasswordExpires: number
    failedLoginAttempts: number
    accountLockedUntil: number
    lastLoginAt: number
    lastLoginIp: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    failedLoginAttempts?: true
  }

  export type UserSumAggregateInputType = {
    failedLoginAttempts?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    role?: true
    status?: true
    resetPasswordToken?: true
    resetPasswordExpires?: true
    failedLoginAttempts?: true
    accountLockedUntil?: true
    lastLoginAt?: true
    lastLoginIp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    role?: true
    status?: true
    resetPasswordToken?: true
    resetPasswordExpires?: true
    failedLoginAttempts?: true
    accountLockedUntil?: true
    lastLoginAt?: true
    lastLoginIp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    role?: true
    status?: true
    resetPasswordToken?: true
    resetPasswordExpires?: true
    failedLoginAttempts?: true
    accountLockedUntil?: true
    lastLoginAt?: true
    lastLoginIp?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status: $Enums.AccountStatus
    resetPasswordToken: string | null
    resetPasswordExpires: Date | null
    failedLoginAttempts: number
    accountLockedUntil: Date | null
    lastLoginAt: Date | null
    lastLoginIp: string | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    status?: boolean
    resetPasswordToken?: boolean
    resetPasswordExpires?: boolean
    failedLoginAttempts?: boolean
    accountLockedUntil?: boolean
    lastLoginAt?: boolean
    lastLoginIp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    workerProfile?: boolean | User$workerProfileArgs<ExtArgs>
    clientProfile?: boolean | User$clientProfileArgs<ExtArgs>
    coordinatorProfile?: boolean | User$coordinatorProfileArgs<ExtArgs>
    auditLogs?: boolean | User$auditLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    status?: boolean
    resetPasswordToken?: boolean
    resetPasswordExpires?: boolean
    failedLoginAttempts?: boolean
    accountLockedUntil?: boolean
    lastLoginAt?: boolean
    lastLoginIp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    status?: boolean
    resetPasswordToken?: boolean
    resetPasswordExpires?: boolean
    failedLoginAttempts?: boolean
    accountLockedUntil?: boolean
    lastLoginAt?: boolean
    lastLoginIp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    role?: boolean
    status?: boolean
    resetPasswordToken?: boolean
    resetPasswordExpires?: boolean
    failedLoginAttempts?: boolean
    accountLockedUntil?: boolean
    lastLoginAt?: boolean
    lastLoginIp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "passwordHash" | "role" | "status" | "resetPasswordToken" | "resetPasswordExpires" | "failedLoginAttempts" | "accountLockedUntil" | "lastLoginAt" | "lastLoginIp" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    workerProfile?: boolean | User$workerProfileArgs<ExtArgs>
    clientProfile?: boolean | User$clientProfileArgs<ExtArgs>
    coordinatorProfile?: boolean | User$coordinatorProfileArgs<ExtArgs>
    auditLogs?: boolean | User$auditLogsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      accounts: Prisma.$AccountPayload<ExtArgs>[]
      sessions: Prisma.$SessionPayload<ExtArgs>[]
      workerProfile: Prisma.$WorkerProfilePayload<ExtArgs> | null
      clientProfile: Prisma.$ClientProfilePayload<ExtArgs> | null
      coordinatorProfile: Prisma.$CoordinatorProfilePayload<ExtArgs> | null
      auditLogs: Prisma.$AuditLogPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string
      role: $Enums.UserRole
      status: $Enums.AccountStatus
      resetPasswordToken: string | null
      resetPasswordExpires: Date | null
      failedLoginAttempts: number
      accountLockedUntil: Date | null
      lastLoginAt: Date | null
      lastLoginIp: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    accounts<T extends User$accountsArgs<ExtArgs> = {}>(args?: Subset<T, User$accountsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    workerProfile<T extends User$workerProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$workerProfileArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    clientProfile<T extends User$clientProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$clientProfileArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    coordinatorProfile<T extends User$coordinatorProfileArgs<ExtArgs> = {}>(args?: Subset<T, User$coordinatorProfileArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    auditLogs<T extends User$auditLogsArgs<ExtArgs> = {}>(args?: Subset<T, User$auditLogsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly status: FieldRef<"User", 'AccountStatus'>
    readonly resetPasswordToken: FieldRef<"User", 'String'>
    readonly resetPasswordExpires: FieldRef<"User", 'DateTime'>
    readonly failedLoginAttempts: FieldRef<"User", 'Int'>
    readonly accountLockedUntil: FieldRef<"User", 'DateTime'>
    readonly lastLoginAt: FieldRef<"User", 'DateTime'>
    readonly lastLoginIp: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.accounts
   */
  export type User$accountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    cursor?: AccountWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * User.workerProfile
   */
  export type User$workerProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    where?: WorkerProfileWhereInput
  }

  /**
   * User.clientProfile
   */
  export type User$clientProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    where?: ClientProfileWhereInput
  }

  /**
   * User.coordinatorProfile
   */
  export type User$coordinatorProfileArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    where?: CoordinatorProfileWhereInput
  }

  /**
   * User.auditLogs
   */
  export type User$auditLogsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    cursor?: AuditLogWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Account
   */

  export type AggregateAccount = {
    _count: AccountCountAggregateOutputType | null
    _avg: AccountAvgAggregateOutputType | null
    _sum: AccountSumAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  export type AccountAvgAggregateOutputType = {
    expires_at: number | null
  }

  export type AccountSumAggregateOutputType = {
    expires_at: number | null
  }

  export type AccountMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: string | null
    provider: string | null
    providerAccountId: string | null
    refresh_token: string | null
    access_token: string | null
    expires_at: number | null
    token_type: string | null
    scope: string | null
    id_token: string | null
    session_state: string | null
  }

  export type AccountMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: string | null
    provider: string | null
    providerAccountId: string | null
    refresh_token: string | null
    access_token: string | null
    expires_at: number | null
    token_type: string | null
    scope: string | null
    id_token: string | null
    session_state: string | null
  }

  export type AccountCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    provider: number
    providerAccountId: number
    refresh_token: number
    access_token: number
    expires_at: number
    token_type: number
    scope: number
    id_token: number
    session_state: number
    _all: number
  }


  export type AccountAvgAggregateInputType = {
    expires_at?: true
  }

  export type AccountSumAggregateInputType = {
    expires_at?: true
  }

  export type AccountMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refresh_token?: true
    access_token?: true
    expires_at?: true
    token_type?: true
    scope?: true
    id_token?: true
    session_state?: true
  }

  export type AccountMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refresh_token?: true
    access_token?: true
    expires_at?: true
    token_type?: true
    scope?: true
    id_token?: true
    session_state?: true
  }

  export type AccountCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refresh_token?: true
    access_token?: true
    expires_at?: true
    token_type?: true
    scope?: true
    id_token?: true
    session_state?: true
    _all?: true
  }

  export type AccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Account to aggregate.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Accounts
    **/
    _count?: true | AccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AccountMaxAggregateInputType
  }

  export type GetAccountAggregateType<T extends AccountAggregateArgs> = {
        [P in keyof T & keyof AggregateAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccount[P]>
      : GetScalarType<T[P], AggregateAccount[P]>
  }




  export type AccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithAggregationInput | AccountOrderByWithAggregationInput[]
    by: AccountScalarFieldEnum[] | AccountScalarFieldEnum
    having?: AccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AccountCountAggregateInputType | true
    _avg?: AccountAvgAggregateInputType
    _sum?: AccountSumAggregateInputType
    _min?: AccountMinAggregateInputType
    _max?: AccountMaxAggregateInputType
  }

  export type AccountGroupByOutputType = {
    id: string
    userId: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token: string | null
    access_token: string | null
    expires_at: number | null
    token_type: string | null
    scope: string | null
    id_token: string | null
    session_state: string | null
    _count: AccountCountAggregateOutputType | null
    _avg: AccountAvgAggregateOutputType | null
    _sum: AccountSumAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  type GetAccountGroupByPayload<T extends AccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AccountGroupByOutputType[P]>
            : GetScalarType<T[P], AccountGroupByOutputType[P]>
        }
      >
    >


  export type AccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refresh_token?: boolean
    access_token?: boolean
    expires_at?: boolean
    token_type?: boolean
    scope?: boolean
    id_token?: boolean
    session_state?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refresh_token?: boolean
    access_token?: boolean
    expires_at?: boolean
    token_type?: boolean
    scope?: boolean
    id_token?: boolean
    session_state?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refresh_token?: boolean
    access_token?: boolean
    expires_at?: boolean
    token_type?: boolean
    scope?: boolean
    id_token?: boolean
    session_state?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refresh_token?: boolean
    access_token?: boolean
    expires_at?: boolean
    token_type?: boolean
    scope?: boolean
    id_token?: boolean
    session_state?: boolean
  }

  export type AccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "type" | "provider" | "providerAccountId" | "refresh_token" | "access_token" | "expires_at" | "token_type" | "scope" | "id_token" | "session_state", ExtArgs["result"]["account"]>
  export type AccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type AccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type AccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $AccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Account"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: string
      provider: string
      providerAccountId: string
      refresh_token: string | null
      access_token: string | null
      expires_at: number | null
      token_type: string | null
      scope: string | null
      id_token: string | null
      session_state: string | null
    }, ExtArgs["result"]["account"]>
    composites: {}
  }

  type AccountGetPayload<S extends boolean | null | undefined | AccountDefaultArgs> = $Result.GetResult<Prisma.$AccountPayload, S>

  type AccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AccountCountAggregateInputType | true
    }

  export interface AccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Account'], meta: { name: 'Account' } }
    /**
     * Find zero or one Account that matches the filter.
     * @param {AccountFindUniqueArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccountFindUniqueArgs>(args: SelectSubset<T, AccountFindUniqueArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Account that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccountFindUniqueOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccountFindUniqueOrThrowArgs>(args: SelectSubset<T, AccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccountFindFirstArgs>(args?: SelectSubset<T, AccountFindFirstArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccountFindFirstOrThrowArgs>(args?: SelectSubset<T, AccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Accounts
     * const accounts = await prisma.account.findMany()
     * 
     * // Get first 10 Accounts
     * const accounts = await prisma.account.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const accountWithIdOnly = await prisma.account.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AccountFindManyArgs>(args?: SelectSubset<T, AccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Account.
     * @param {AccountCreateArgs} args - Arguments to create a Account.
     * @example
     * // Create one Account
     * const Account = await prisma.account.create({
     *   data: {
     *     // ... data to create a Account
     *   }
     * })
     * 
     */
    create<T extends AccountCreateArgs>(args: SelectSubset<T, AccountCreateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Accounts.
     * @param {AccountCreateManyArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AccountCreateManyArgs>(args?: SelectSubset<T, AccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Accounts and returns the data saved in the database.
     * @param {AccountCreateManyAndReturnArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AccountCreateManyAndReturnArgs>(args?: SelectSubset<T, AccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Account.
     * @param {AccountDeleteArgs} args - Arguments to delete one Account.
     * @example
     * // Delete one Account
     * const Account = await prisma.account.delete({
     *   where: {
     *     // ... filter to delete one Account
     *   }
     * })
     * 
     */
    delete<T extends AccountDeleteArgs>(args: SelectSubset<T, AccountDeleteArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Account.
     * @param {AccountUpdateArgs} args - Arguments to update one Account.
     * @example
     * // Update one Account
     * const account = await prisma.account.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AccountUpdateArgs>(args: SelectSubset<T, AccountUpdateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Accounts.
     * @param {AccountDeleteManyArgs} args - Arguments to filter Accounts to delete.
     * @example
     * // Delete a few Accounts
     * const { count } = await prisma.account.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AccountDeleteManyArgs>(args?: SelectSubset<T, AccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AccountUpdateManyArgs>(args: SelectSubset<T, AccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts and returns the data updated in the database.
     * @param {AccountUpdateManyAndReturnArgs} args - Arguments to update many Accounts.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AccountUpdateManyAndReturnArgs>(args: SelectSubset<T, AccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Account.
     * @param {AccountUpsertArgs} args - Arguments to update or create a Account.
     * @example
     * // Update or create a Account
     * const account = await prisma.account.upsert({
     *   create: {
     *     // ... data to create a Account
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Account we want to update
     *   }
     * })
     */
    upsert<T extends AccountUpsertArgs>(args: SelectSubset<T, AccountUpsertArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountCountArgs} args - Arguments to filter Accounts to count.
     * @example
     * // Count the number of Accounts
     * const count = await prisma.account.count({
     *   where: {
     *     // ... the filter for the Accounts we want to count
     *   }
     * })
    **/
    count<T extends AccountCountArgs>(
      args?: Subset<T, AccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AccountAggregateArgs>(args: Subset<T, AccountAggregateArgs>): Prisma.PrismaPromise<GetAccountAggregateType<T>>

    /**
     * Group by Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccountGroupByArgs['orderBy'] }
        : { orderBy?: AccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Account model
   */
  readonly fields: AccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Account.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Account model
   */
  interface AccountFieldRefs {
    readonly id: FieldRef<"Account", 'String'>
    readonly userId: FieldRef<"Account", 'String'>
    readonly type: FieldRef<"Account", 'String'>
    readonly provider: FieldRef<"Account", 'String'>
    readonly providerAccountId: FieldRef<"Account", 'String'>
    readonly refresh_token: FieldRef<"Account", 'String'>
    readonly access_token: FieldRef<"Account", 'String'>
    readonly expires_at: FieldRef<"Account", 'Int'>
    readonly token_type: FieldRef<"Account", 'String'>
    readonly scope: FieldRef<"Account", 'String'>
    readonly id_token: FieldRef<"Account", 'String'>
    readonly session_state: FieldRef<"Account", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Account findUnique
   */
  export type AccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findUniqueOrThrow
   */
  export type AccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findFirst
   */
  export type AccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findFirstOrThrow
   */
  export type AccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findMany
   */
  export type AccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account create
   */
  export type AccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to create a Account.
     */
    data: XOR<AccountCreateInput, AccountUncheckedCreateInput>
  }

  /**
   * Account createMany
   */
  export type AccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Account createManyAndReturn
   */
  export type AccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Account update
   */
  export type AccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to update a Account.
     */
    data: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
    /**
     * Choose, which Account to update.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account updateMany
   */
  export type AccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
  }

  /**
   * Account updateManyAndReturn
   */
  export type AccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Account upsert
   */
  export type AccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The filter to search for the Account to update in case it exists.
     */
    where: AccountWhereUniqueInput
    /**
     * In case the Account found by the `where` argument doesn't exist, create a new Account with this data.
     */
    create: XOR<AccountCreateInput, AccountUncheckedCreateInput>
    /**
     * In case the Account was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
  }

  /**
   * Account delete
   */
  export type AccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter which Account to delete.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account deleteMany
   */
  export type AccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to delete
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to delete.
     */
    limit?: number
  }

  /**
   * Account without action
   */
  export type AccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    sessionToken: string | null
    userId: string | null
    expires: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    sessionToken: string | null
    userId: string | null
    expires: Date | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    sessionToken: number
    userId: number
    expires: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    sessionToken: string
    userId: string
    expires: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
  }

  export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionToken" | "userId" | "expires", ExtArgs["result"]["session"]>
  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionToken: string
      userId: string
      expires: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions and returns the data updated in the database.
     * @param {SessionUpdateManyAndReturnArgs} args - Arguments to update many Sessions.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly sessionToken: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
    readonly expires: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session updateManyAndReturn
   */
  export type SessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Model VerificationToken
   */

  export type AggregateVerificationToken = {
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  export type VerificationTokenMinAggregateOutputType = {
    identifier: string | null
    token: string | null
    expires: Date | null
  }

  export type VerificationTokenMaxAggregateOutputType = {
    identifier: string | null
    token: string | null
    expires: Date | null
  }

  export type VerificationTokenCountAggregateOutputType = {
    identifier: number
    token: number
    expires: number
    _all: number
  }


  export type VerificationTokenMinAggregateInputType = {
    identifier?: true
    token?: true
    expires?: true
  }

  export type VerificationTokenMaxAggregateInputType = {
    identifier?: true
    token?: true
    expires?: true
  }

  export type VerificationTokenCountAggregateInputType = {
    identifier?: true
    token?: true
    expires?: true
    _all?: true
  }

  export type VerificationTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationToken to aggregate.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationTokens
    **/
    _count?: true | VerificationTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type GetVerificationTokenAggregateType<T extends VerificationTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationToken[P]>
      : GetScalarType<T[P], AggregateVerificationToken[P]>
  }




  export type VerificationTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationTokenWhereInput
    orderBy?: VerificationTokenOrderByWithAggregationInput | VerificationTokenOrderByWithAggregationInput[]
    by: VerificationTokenScalarFieldEnum[] | VerificationTokenScalarFieldEnum
    having?: VerificationTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationTokenCountAggregateInputType | true
    _min?: VerificationTokenMinAggregateInputType
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type VerificationTokenGroupByOutputType = {
    identifier: string
    token: string
    expires: Date
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  type GetVerificationTokenGroupByPayload<T extends VerificationTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
        }
      >
    >


  export type VerificationTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    identifier?: boolean
    token?: boolean
    expires?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    identifier?: boolean
    token?: boolean
    expires?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    identifier?: boolean
    token?: boolean
    expires?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectScalar = {
    identifier?: boolean
    token?: boolean
    expires?: boolean
  }

  export type VerificationTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"identifier" | "token" | "expires", ExtArgs["result"]["verificationToken"]>

  export type $VerificationTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationToken"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      identifier: string
      token: string
      expires: Date
    }, ExtArgs["result"]["verificationToken"]>
    composites: {}
  }

  type VerificationTokenGetPayload<S extends boolean | null | undefined | VerificationTokenDefaultArgs> = $Result.GetResult<Prisma.$VerificationTokenPayload, S>

  type VerificationTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationTokenCountAggregateInputType | true
    }

  export interface VerificationTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationToken'], meta: { name: 'VerificationToken' } }
    /**
     * Find zero or one VerificationToken that matches the filter.
     * @param {VerificationTokenFindUniqueArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationTokenFindUniqueArgs>(args: SelectSubset<T, VerificationTokenFindUniqueArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationTokenFindUniqueOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationTokenFindFirstArgs>(args?: SelectSubset<T, VerificationTokenFindFirstArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany()
     * 
     * // Get first 10 VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany({ take: 10 })
     * 
     * // Only select the `identifier`
     * const verificationTokenWithIdentifierOnly = await prisma.verificationToken.findMany({ select: { identifier: true } })
     * 
     */
    findMany<T extends VerificationTokenFindManyArgs>(args?: SelectSubset<T, VerificationTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationToken.
     * @param {VerificationTokenCreateArgs} args - Arguments to create a VerificationToken.
     * @example
     * // Create one VerificationToken
     * const VerificationToken = await prisma.verificationToken.create({
     *   data: {
     *     // ... data to create a VerificationToken
     *   }
     * })
     * 
     */
    create<T extends VerificationTokenCreateArgs>(args: SelectSubset<T, VerificationTokenCreateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationTokens.
     * @param {VerificationTokenCreateManyArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationTokenCreateManyArgs>(args?: SelectSubset<T, VerificationTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationTokens and returns the data saved in the database.
     * @param {VerificationTokenCreateManyAndReturnArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationTokens and only return the `identifier`
     * const verificationTokenWithIdentifierOnly = await prisma.verificationToken.createManyAndReturn({
     *   select: { identifier: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationToken.
     * @param {VerificationTokenDeleteArgs} args - Arguments to delete one VerificationToken.
     * @example
     * // Delete one VerificationToken
     * const VerificationToken = await prisma.verificationToken.delete({
     *   where: {
     *     // ... filter to delete one VerificationToken
     *   }
     * })
     * 
     */
    delete<T extends VerificationTokenDeleteArgs>(args: SelectSubset<T, VerificationTokenDeleteArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationToken.
     * @param {VerificationTokenUpdateArgs} args - Arguments to update one VerificationToken.
     * @example
     * // Update one VerificationToken
     * const verificationToken = await prisma.verificationToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationTokenUpdateArgs>(args: SelectSubset<T, VerificationTokenUpdateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationTokens.
     * @param {VerificationTokenDeleteManyArgs} args - Arguments to filter VerificationTokens to delete.
     * @example
     * // Delete a few VerificationTokens
     * const { count } = await prisma.verificationToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationTokenDeleteManyArgs>(args?: SelectSubset<T, VerificationTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationTokenUpdateManyArgs>(args: SelectSubset<T, VerificationTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens and returns the data updated in the database.
     * @param {VerificationTokenUpdateManyAndReturnArgs} args - Arguments to update many VerificationTokens.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationTokens and only return the `identifier`
     * const verificationTokenWithIdentifierOnly = await prisma.verificationToken.updateManyAndReturn({
     *   select: { identifier: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationToken.
     * @param {VerificationTokenUpsertArgs} args - Arguments to update or create a VerificationToken.
     * @example
     * // Update or create a VerificationToken
     * const verificationToken = await prisma.verificationToken.upsert({
     *   create: {
     *     // ... data to create a VerificationToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationToken we want to update
     *   }
     * })
     */
    upsert<T extends VerificationTokenUpsertArgs>(args: SelectSubset<T, VerificationTokenUpsertArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenCountArgs} args - Arguments to filter VerificationTokens to count.
     * @example
     * // Count the number of VerificationTokens
     * const count = await prisma.verificationToken.count({
     *   where: {
     *     // ... the filter for the VerificationTokens we want to count
     *   }
     * })
    **/
    count<T extends VerificationTokenCountArgs>(
      args?: Subset<T, VerificationTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationTokenAggregateArgs>(args: Subset<T, VerificationTokenAggregateArgs>): Prisma.PrismaPromise<GetVerificationTokenAggregateType<T>>

    /**
     * Group by VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationTokenGroupByArgs['orderBy'] }
        : { orderBy?: VerificationTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationToken model
   */
  readonly fields: VerificationTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationToken model
   */
  interface VerificationTokenFieldRefs {
    readonly identifier: FieldRef<"VerificationToken", 'String'>
    readonly token: FieldRef<"VerificationToken", 'String'>
    readonly expires: FieldRef<"VerificationToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationToken findUnique
   */
  export type VerificationTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findUniqueOrThrow
   */
  export type VerificationTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findFirst
   */
  export type VerificationTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findFirstOrThrow
   */
  export type VerificationTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findMany
   */
  export type VerificationTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationTokens to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken create
   */
  export type VerificationTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data needed to create a VerificationToken.
     */
    data: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
  }

  /**
   * VerificationToken createMany
   */
  export type VerificationTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationToken createManyAndReturn
   */
  export type VerificationTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationToken update
   */
  export type VerificationTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data needed to update a VerificationToken.
     */
    data: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
    /**
     * Choose, which VerificationToken to update.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken updateMany
   */
  export type VerificationTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
  }

  /**
   * VerificationToken updateManyAndReturn
   */
  export type VerificationTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
  }

  /**
   * VerificationToken upsert
   */
  export type VerificationTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The filter to search for the VerificationToken to update in case it exists.
     */
    where: VerificationTokenWhereUniqueInput
    /**
     * In case the VerificationToken found by the `where` argument doesn't exist, create a new VerificationToken with this data.
     */
    create: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
    /**
     * In case the VerificationToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
  }

  /**
   * VerificationToken delete
   */
  export type VerificationTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter which VerificationToken to delete.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken deleteMany
   */
  export type VerificationTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationTokens to delete
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to delete.
     */
    limit?: number
  }

  /**
   * VerificationToken without action
   */
  export type VerificationTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
  }


  /**
   * Model WorkerProfile
   */

  export type AggregateWorkerProfile = {
    _count: WorkerProfileCountAggregateOutputType | null
    _avg: WorkerProfileAvgAggregateOutputType | null
    _sum: WorkerProfileSumAggregateOutputType | null
    _min: WorkerProfileMinAggregateOutputType | null
    _max: WorkerProfileMaxAggregateOutputType | null
  }

  export type WorkerProfileAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type WorkerProfileSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type WorkerProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    middleName: string | null
    lastName: string | null
    mobile: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
    city: string | null
    state: string | null
    postalCode: string | null
    age: string | null
    gender: string | null
    genderIdentity: string | null
    experience: string | null
    introduction: string | null
    qualifications: string | null
    hasVehicle: string | null
    funFact: string | null
    hobbies: string | null
    uniqueService: string | null
    whyEnjoyWork: string | null
    additionalInfo: string | null
    consentProfileShare: boolean | null
    consentMarketing: boolean | null
    profileCompleted: boolean | null
    isPublished: boolean | null
    verificationStatus: $Enums.VerificationStatus | null
    verificationSubmittedAt: Date | null
    verificationReviewedAt: Date | null
    verificationApprovedAt: Date | null
    verificationRejectedAt: Date | null
    verificationNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkerProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    middleName: string | null
    lastName: string | null
    mobile: string | null
    location: string | null
    latitude: number | null
    longitude: number | null
    city: string | null
    state: string | null
    postalCode: string | null
    age: string | null
    gender: string | null
    genderIdentity: string | null
    experience: string | null
    introduction: string | null
    qualifications: string | null
    hasVehicle: string | null
    funFact: string | null
    hobbies: string | null
    uniqueService: string | null
    whyEnjoyWork: string | null
    additionalInfo: string | null
    consentProfileShare: boolean | null
    consentMarketing: boolean | null
    profileCompleted: boolean | null
    isPublished: boolean | null
    verificationStatus: $Enums.VerificationStatus | null
    verificationSubmittedAt: Date | null
    verificationReviewedAt: Date | null
    verificationApprovedAt: Date | null
    verificationRejectedAt: Date | null
    verificationNotes: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WorkerProfileCountAggregateOutputType = {
    id: number
    userId: number
    firstName: number
    middleName: number
    lastName: number
    mobile: number
    location: number
    latitude: number
    longitude: number
    city: number
    state: number
    postalCode: number
    age: number
    gender: number
    genderIdentity: number
    languages: number
    services: number
    supportWorkerCategories: number
    experience: number
    introduction: number
    qualifications: number
    hasVehicle: number
    funFact: number
    hobbies: number
    uniqueService: number
    whyEnjoyWork: number
    additionalInfo: number
    photos: number
    consentProfileShare: number
    consentMarketing: number
    profileCompleted: number
    isPublished: number
    verificationStatus: number
    verificationChecklist: number
    submittedDocuments: number
    verificationSubmittedAt: number
    verificationReviewedAt: number
    verificationApprovedAt: number
    verificationRejectedAt: number
    verificationNotes: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WorkerProfileAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type WorkerProfileSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type WorkerProfileMinAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    middleName?: true
    lastName?: true
    mobile?: true
    location?: true
    latitude?: true
    longitude?: true
    city?: true
    state?: true
    postalCode?: true
    age?: true
    gender?: true
    genderIdentity?: true
    experience?: true
    introduction?: true
    qualifications?: true
    hasVehicle?: true
    funFact?: true
    hobbies?: true
    uniqueService?: true
    whyEnjoyWork?: true
    additionalInfo?: true
    consentProfileShare?: true
    consentMarketing?: true
    profileCompleted?: true
    isPublished?: true
    verificationStatus?: true
    verificationSubmittedAt?: true
    verificationReviewedAt?: true
    verificationApprovedAt?: true
    verificationRejectedAt?: true
    verificationNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkerProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    middleName?: true
    lastName?: true
    mobile?: true
    location?: true
    latitude?: true
    longitude?: true
    city?: true
    state?: true
    postalCode?: true
    age?: true
    gender?: true
    genderIdentity?: true
    experience?: true
    introduction?: true
    qualifications?: true
    hasVehicle?: true
    funFact?: true
    hobbies?: true
    uniqueService?: true
    whyEnjoyWork?: true
    additionalInfo?: true
    consentProfileShare?: true
    consentMarketing?: true
    profileCompleted?: true
    isPublished?: true
    verificationStatus?: true
    verificationSubmittedAt?: true
    verificationReviewedAt?: true
    verificationApprovedAt?: true
    verificationRejectedAt?: true
    verificationNotes?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WorkerProfileCountAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    middleName?: true
    lastName?: true
    mobile?: true
    location?: true
    latitude?: true
    longitude?: true
    city?: true
    state?: true
    postalCode?: true
    age?: true
    gender?: true
    genderIdentity?: true
    languages?: true
    services?: true
    supportWorkerCategories?: true
    experience?: true
    introduction?: true
    qualifications?: true
    hasVehicle?: true
    funFact?: true
    hobbies?: true
    uniqueService?: true
    whyEnjoyWork?: true
    additionalInfo?: true
    photos?: true
    consentProfileShare?: true
    consentMarketing?: true
    profileCompleted?: true
    isPublished?: true
    verificationStatus?: true
    verificationChecklist?: true
    submittedDocuments?: true
    verificationSubmittedAt?: true
    verificationReviewedAt?: true
    verificationApprovedAt?: true
    verificationRejectedAt?: true
    verificationNotes?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WorkerProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkerProfile to aggregate.
     */
    where?: WorkerProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkerProfiles to fetch.
     */
    orderBy?: WorkerProfileOrderByWithRelationInput | WorkerProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WorkerProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkerProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkerProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WorkerProfiles
    **/
    _count?: true | WorkerProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WorkerProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WorkerProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WorkerProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WorkerProfileMaxAggregateInputType
  }

  export type GetWorkerProfileAggregateType<T extends WorkerProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateWorkerProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWorkerProfile[P]>
      : GetScalarType<T[P], AggregateWorkerProfile[P]>
  }




  export type WorkerProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WorkerProfileWhereInput
    orderBy?: WorkerProfileOrderByWithAggregationInput | WorkerProfileOrderByWithAggregationInput[]
    by: WorkerProfileScalarFieldEnum[] | WorkerProfileScalarFieldEnum
    having?: WorkerProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WorkerProfileCountAggregateInputType | true
    _avg?: WorkerProfileAvgAggregateInputType
    _sum?: WorkerProfileSumAggregateInputType
    _min?: WorkerProfileMinAggregateInputType
    _max?: WorkerProfileMaxAggregateInputType
  }

  export type WorkerProfileGroupByOutputType = {
    id: string
    userId: string
    firstName: string
    middleName: string | null
    lastName: string
    mobile: string
    location: string
    latitude: number | null
    longitude: number | null
    city: string | null
    state: string | null
    postalCode: string | null
    age: string
    gender: string
    genderIdentity: string
    languages: string[]
    services: string[]
    supportWorkerCategories: string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo: string | null
    photos: JsonValue | null
    consentProfileShare: boolean
    consentMarketing: boolean
    profileCompleted: boolean
    isPublished: boolean
    verificationStatus: $Enums.VerificationStatus
    verificationChecklist: JsonValue | null
    submittedDocuments: JsonValue | null
    verificationSubmittedAt: Date | null
    verificationReviewedAt: Date | null
    verificationApprovedAt: Date | null
    verificationRejectedAt: Date | null
    verificationNotes: string | null
    createdAt: Date
    updatedAt: Date
    _count: WorkerProfileCountAggregateOutputType | null
    _avg: WorkerProfileAvgAggregateOutputType | null
    _sum: WorkerProfileSumAggregateOutputType | null
    _min: WorkerProfileMinAggregateOutputType | null
    _max: WorkerProfileMaxAggregateOutputType | null
  }

  type GetWorkerProfileGroupByPayload<T extends WorkerProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WorkerProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WorkerProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WorkerProfileGroupByOutputType[P]>
            : GetScalarType<T[P], WorkerProfileGroupByOutputType[P]>
        }
      >
    >


  export type WorkerProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    middleName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    city?: boolean
    state?: boolean
    postalCode?: boolean
    age?: boolean
    gender?: boolean
    genderIdentity?: boolean
    languages?: boolean
    services?: boolean
    supportWorkerCategories?: boolean
    experience?: boolean
    introduction?: boolean
    qualifications?: boolean
    hasVehicle?: boolean
    funFact?: boolean
    hobbies?: boolean
    uniqueService?: boolean
    whyEnjoyWork?: boolean
    additionalInfo?: boolean
    photos?: boolean
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: boolean
    verificationChecklist?: boolean
    submittedDocuments?: boolean
    verificationSubmittedAt?: boolean
    verificationReviewedAt?: boolean
    verificationApprovedAt?: boolean
    verificationRejectedAt?: boolean
    verificationNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    verificationRequirements?: boolean | WorkerProfile$verificationRequirementsArgs<ExtArgs>
    _count?: boolean | WorkerProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workerProfile"]>

  export type WorkerProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    middleName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    city?: boolean
    state?: boolean
    postalCode?: boolean
    age?: boolean
    gender?: boolean
    genderIdentity?: boolean
    languages?: boolean
    services?: boolean
    supportWorkerCategories?: boolean
    experience?: boolean
    introduction?: boolean
    qualifications?: boolean
    hasVehicle?: boolean
    funFact?: boolean
    hobbies?: boolean
    uniqueService?: boolean
    whyEnjoyWork?: boolean
    additionalInfo?: boolean
    photos?: boolean
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: boolean
    verificationChecklist?: boolean
    submittedDocuments?: boolean
    verificationSubmittedAt?: boolean
    verificationReviewedAt?: boolean
    verificationApprovedAt?: boolean
    verificationRejectedAt?: boolean
    verificationNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workerProfile"]>

  export type WorkerProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    middleName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    city?: boolean
    state?: boolean
    postalCode?: boolean
    age?: boolean
    gender?: boolean
    genderIdentity?: boolean
    languages?: boolean
    services?: boolean
    supportWorkerCategories?: boolean
    experience?: boolean
    introduction?: boolean
    qualifications?: boolean
    hasVehicle?: boolean
    funFact?: boolean
    hobbies?: boolean
    uniqueService?: boolean
    whyEnjoyWork?: boolean
    additionalInfo?: boolean
    photos?: boolean
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: boolean
    verificationChecklist?: boolean
    submittedDocuments?: boolean
    verificationSubmittedAt?: boolean
    verificationReviewedAt?: boolean
    verificationApprovedAt?: boolean
    verificationRejectedAt?: boolean
    verificationNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["workerProfile"]>

  export type WorkerProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    firstName?: boolean
    middleName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    latitude?: boolean
    longitude?: boolean
    city?: boolean
    state?: boolean
    postalCode?: boolean
    age?: boolean
    gender?: boolean
    genderIdentity?: boolean
    languages?: boolean
    services?: boolean
    supportWorkerCategories?: boolean
    experience?: boolean
    introduction?: boolean
    qualifications?: boolean
    hasVehicle?: boolean
    funFact?: boolean
    hobbies?: boolean
    uniqueService?: boolean
    whyEnjoyWork?: boolean
    additionalInfo?: boolean
    photos?: boolean
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: boolean
    verificationChecklist?: boolean
    submittedDocuments?: boolean
    verificationSubmittedAt?: boolean
    verificationReviewedAt?: boolean
    verificationApprovedAt?: boolean
    verificationRejectedAt?: boolean
    verificationNotes?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WorkerProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "firstName" | "middleName" | "lastName" | "mobile" | "location" | "latitude" | "longitude" | "city" | "state" | "postalCode" | "age" | "gender" | "genderIdentity" | "languages" | "services" | "supportWorkerCategories" | "experience" | "introduction" | "qualifications" | "hasVehicle" | "funFact" | "hobbies" | "uniqueService" | "whyEnjoyWork" | "additionalInfo" | "photos" | "consentProfileShare" | "consentMarketing" | "profileCompleted" | "isPublished" | "verificationStatus" | "verificationChecklist" | "submittedDocuments" | "verificationSubmittedAt" | "verificationReviewedAt" | "verificationApprovedAt" | "verificationRejectedAt" | "verificationNotes" | "createdAt" | "updatedAt", ExtArgs["result"]["workerProfile"]>
  export type WorkerProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    verificationRequirements?: boolean | WorkerProfile$verificationRequirementsArgs<ExtArgs>
    _count?: boolean | WorkerProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type WorkerProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type WorkerProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $WorkerProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WorkerProfile"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      verificationRequirements: Prisma.$VerificationRequirementPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      firstName: string
      middleName: string | null
      lastName: string
      mobile: string
      location: string
      latitude: number | null
      longitude: number | null
      city: string | null
      state: string | null
      postalCode: string | null
      age: string
      gender: string
      genderIdentity: string
      languages: string[]
      services: string[]
      supportWorkerCategories: string[]
      experience: string
      introduction: string
      qualifications: string
      hasVehicle: string
      funFact: string
      hobbies: string
      uniqueService: string
      whyEnjoyWork: string
      additionalInfo: string | null
      photos: Prisma.JsonValue | null
      consentProfileShare: boolean
      consentMarketing: boolean
      profileCompleted: boolean
      isPublished: boolean
      verificationStatus: $Enums.VerificationStatus
      verificationChecklist: Prisma.JsonValue | null
      submittedDocuments: Prisma.JsonValue | null
      verificationSubmittedAt: Date | null
      verificationReviewedAt: Date | null
      verificationApprovedAt: Date | null
      verificationRejectedAt: Date | null
      verificationNotes: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["workerProfile"]>
    composites: {}
  }

  type WorkerProfileGetPayload<S extends boolean | null | undefined | WorkerProfileDefaultArgs> = $Result.GetResult<Prisma.$WorkerProfilePayload, S>

  type WorkerProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WorkerProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WorkerProfileCountAggregateInputType | true
    }

  export interface WorkerProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WorkerProfile'], meta: { name: 'WorkerProfile' } }
    /**
     * Find zero or one WorkerProfile that matches the filter.
     * @param {WorkerProfileFindUniqueArgs} args - Arguments to find a WorkerProfile
     * @example
     * // Get one WorkerProfile
     * const workerProfile = await prisma.workerProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WorkerProfileFindUniqueArgs>(args: SelectSubset<T, WorkerProfileFindUniqueArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WorkerProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WorkerProfileFindUniqueOrThrowArgs} args - Arguments to find a WorkerProfile
     * @example
     * // Get one WorkerProfile
     * const workerProfile = await prisma.workerProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WorkerProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, WorkerProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkerProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileFindFirstArgs} args - Arguments to find a WorkerProfile
     * @example
     * // Get one WorkerProfile
     * const workerProfile = await prisma.workerProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WorkerProfileFindFirstArgs>(args?: SelectSubset<T, WorkerProfileFindFirstArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WorkerProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileFindFirstOrThrowArgs} args - Arguments to find a WorkerProfile
     * @example
     * // Get one WorkerProfile
     * const workerProfile = await prisma.workerProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WorkerProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, WorkerProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WorkerProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WorkerProfiles
     * const workerProfiles = await prisma.workerProfile.findMany()
     * 
     * // Get first 10 WorkerProfiles
     * const workerProfiles = await prisma.workerProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const workerProfileWithIdOnly = await prisma.workerProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WorkerProfileFindManyArgs>(args?: SelectSubset<T, WorkerProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WorkerProfile.
     * @param {WorkerProfileCreateArgs} args - Arguments to create a WorkerProfile.
     * @example
     * // Create one WorkerProfile
     * const WorkerProfile = await prisma.workerProfile.create({
     *   data: {
     *     // ... data to create a WorkerProfile
     *   }
     * })
     * 
     */
    create<T extends WorkerProfileCreateArgs>(args: SelectSubset<T, WorkerProfileCreateArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WorkerProfiles.
     * @param {WorkerProfileCreateManyArgs} args - Arguments to create many WorkerProfiles.
     * @example
     * // Create many WorkerProfiles
     * const workerProfile = await prisma.workerProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WorkerProfileCreateManyArgs>(args?: SelectSubset<T, WorkerProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WorkerProfiles and returns the data saved in the database.
     * @param {WorkerProfileCreateManyAndReturnArgs} args - Arguments to create many WorkerProfiles.
     * @example
     * // Create many WorkerProfiles
     * const workerProfile = await prisma.workerProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WorkerProfiles and only return the `id`
     * const workerProfileWithIdOnly = await prisma.workerProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WorkerProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, WorkerProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WorkerProfile.
     * @param {WorkerProfileDeleteArgs} args - Arguments to delete one WorkerProfile.
     * @example
     * // Delete one WorkerProfile
     * const WorkerProfile = await prisma.workerProfile.delete({
     *   where: {
     *     // ... filter to delete one WorkerProfile
     *   }
     * })
     * 
     */
    delete<T extends WorkerProfileDeleteArgs>(args: SelectSubset<T, WorkerProfileDeleteArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WorkerProfile.
     * @param {WorkerProfileUpdateArgs} args - Arguments to update one WorkerProfile.
     * @example
     * // Update one WorkerProfile
     * const workerProfile = await prisma.workerProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WorkerProfileUpdateArgs>(args: SelectSubset<T, WorkerProfileUpdateArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WorkerProfiles.
     * @param {WorkerProfileDeleteManyArgs} args - Arguments to filter WorkerProfiles to delete.
     * @example
     * // Delete a few WorkerProfiles
     * const { count } = await prisma.workerProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WorkerProfileDeleteManyArgs>(args?: SelectSubset<T, WorkerProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkerProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WorkerProfiles
     * const workerProfile = await prisma.workerProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WorkerProfileUpdateManyArgs>(args: SelectSubset<T, WorkerProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WorkerProfiles and returns the data updated in the database.
     * @param {WorkerProfileUpdateManyAndReturnArgs} args - Arguments to update many WorkerProfiles.
     * @example
     * // Update many WorkerProfiles
     * const workerProfile = await prisma.workerProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WorkerProfiles and only return the `id`
     * const workerProfileWithIdOnly = await prisma.workerProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WorkerProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, WorkerProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WorkerProfile.
     * @param {WorkerProfileUpsertArgs} args - Arguments to update or create a WorkerProfile.
     * @example
     * // Update or create a WorkerProfile
     * const workerProfile = await prisma.workerProfile.upsert({
     *   create: {
     *     // ... data to create a WorkerProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WorkerProfile we want to update
     *   }
     * })
     */
    upsert<T extends WorkerProfileUpsertArgs>(args: SelectSubset<T, WorkerProfileUpsertArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WorkerProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileCountArgs} args - Arguments to filter WorkerProfiles to count.
     * @example
     * // Count the number of WorkerProfiles
     * const count = await prisma.workerProfile.count({
     *   where: {
     *     // ... the filter for the WorkerProfiles we want to count
     *   }
     * })
    **/
    count<T extends WorkerProfileCountArgs>(
      args?: Subset<T, WorkerProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WorkerProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WorkerProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WorkerProfileAggregateArgs>(args: Subset<T, WorkerProfileAggregateArgs>): Prisma.PrismaPromise<GetWorkerProfileAggregateType<T>>

    /**
     * Group by WorkerProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WorkerProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WorkerProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WorkerProfileGroupByArgs['orderBy'] }
        : { orderBy?: WorkerProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WorkerProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWorkerProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WorkerProfile model
   */
  readonly fields: WorkerProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WorkerProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WorkerProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    verificationRequirements<T extends WorkerProfile$verificationRequirementsArgs<ExtArgs> = {}>(args?: Subset<T, WorkerProfile$verificationRequirementsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WorkerProfile model
   */
  interface WorkerProfileFieldRefs {
    readonly id: FieldRef<"WorkerProfile", 'String'>
    readonly userId: FieldRef<"WorkerProfile", 'String'>
    readonly firstName: FieldRef<"WorkerProfile", 'String'>
    readonly middleName: FieldRef<"WorkerProfile", 'String'>
    readonly lastName: FieldRef<"WorkerProfile", 'String'>
    readonly mobile: FieldRef<"WorkerProfile", 'String'>
    readonly location: FieldRef<"WorkerProfile", 'String'>
    readonly latitude: FieldRef<"WorkerProfile", 'Float'>
    readonly longitude: FieldRef<"WorkerProfile", 'Float'>
    readonly city: FieldRef<"WorkerProfile", 'String'>
    readonly state: FieldRef<"WorkerProfile", 'String'>
    readonly postalCode: FieldRef<"WorkerProfile", 'String'>
    readonly age: FieldRef<"WorkerProfile", 'String'>
    readonly gender: FieldRef<"WorkerProfile", 'String'>
    readonly genderIdentity: FieldRef<"WorkerProfile", 'String'>
    readonly languages: FieldRef<"WorkerProfile", 'String[]'>
    readonly services: FieldRef<"WorkerProfile", 'String[]'>
    readonly supportWorkerCategories: FieldRef<"WorkerProfile", 'String[]'>
    readonly experience: FieldRef<"WorkerProfile", 'String'>
    readonly introduction: FieldRef<"WorkerProfile", 'String'>
    readonly qualifications: FieldRef<"WorkerProfile", 'String'>
    readonly hasVehicle: FieldRef<"WorkerProfile", 'String'>
    readonly funFact: FieldRef<"WorkerProfile", 'String'>
    readonly hobbies: FieldRef<"WorkerProfile", 'String'>
    readonly uniqueService: FieldRef<"WorkerProfile", 'String'>
    readonly whyEnjoyWork: FieldRef<"WorkerProfile", 'String'>
    readonly additionalInfo: FieldRef<"WorkerProfile", 'String'>
    readonly photos: FieldRef<"WorkerProfile", 'Json'>
    readonly consentProfileShare: FieldRef<"WorkerProfile", 'Boolean'>
    readonly consentMarketing: FieldRef<"WorkerProfile", 'Boolean'>
    readonly profileCompleted: FieldRef<"WorkerProfile", 'Boolean'>
    readonly isPublished: FieldRef<"WorkerProfile", 'Boolean'>
    readonly verificationStatus: FieldRef<"WorkerProfile", 'VerificationStatus'>
    readonly verificationChecklist: FieldRef<"WorkerProfile", 'Json'>
    readonly submittedDocuments: FieldRef<"WorkerProfile", 'Json'>
    readonly verificationSubmittedAt: FieldRef<"WorkerProfile", 'DateTime'>
    readonly verificationReviewedAt: FieldRef<"WorkerProfile", 'DateTime'>
    readonly verificationApprovedAt: FieldRef<"WorkerProfile", 'DateTime'>
    readonly verificationRejectedAt: FieldRef<"WorkerProfile", 'DateTime'>
    readonly verificationNotes: FieldRef<"WorkerProfile", 'String'>
    readonly createdAt: FieldRef<"WorkerProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"WorkerProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WorkerProfile findUnique
   */
  export type WorkerProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter, which WorkerProfile to fetch.
     */
    where: WorkerProfileWhereUniqueInput
  }

  /**
   * WorkerProfile findUniqueOrThrow
   */
  export type WorkerProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter, which WorkerProfile to fetch.
     */
    where: WorkerProfileWhereUniqueInput
  }

  /**
   * WorkerProfile findFirst
   */
  export type WorkerProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter, which WorkerProfile to fetch.
     */
    where?: WorkerProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkerProfiles to fetch.
     */
    orderBy?: WorkerProfileOrderByWithRelationInput | WorkerProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkerProfiles.
     */
    cursor?: WorkerProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkerProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkerProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkerProfiles.
     */
    distinct?: WorkerProfileScalarFieldEnum | WorkerProfileScalarFieldEnum[]
  }

  /**
   * WorkerProfile findFirstOrThrow
   */
  export type WorkerProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter, which WorkerProfile to fetch.
     */
    where?: WorkerProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkerProfiles to fetch.
     */
    orderBy?: WorkerProfileOrderByWithRelationInput | WorkerProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WorkerProfiles.
     */
    cursor?: WorkerProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkerProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkerProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WorkerProfiles.
     */
    distinct?: WorkerProfileScalarFieldEnum | WorkerProfileScalarFieldEnum[]
  }

  /**
   * WorkerProfile findMany
   */
  export type WorkerProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter, which WorkerProfiles to fetch.
     */
    where?: WorkerProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WorkerProfiles to fetch.
     */
    orderBy?: WorkerProfileOrderByWithRelationInput | WorkerProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WorkerProfiles.
     */
    cursor?: WorkerProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WorkerProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WorkerProfiles.
     */
    skip?: number
    distinct?: WorkerProfileScalarFieldEnum | WorkerProfileScalarFieldEnum[]
  }

  /**
   * WorkerProfile create
   */
  export type WorkerProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a WorkerProfile.
     */
    data: XOR<WorkerProfileCreateInput, WorkerProfileUncheckedCreateInput>
  }

  /**
   * WorkerProfile createMany
   */
  export type WorkerProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WorkerProfiles.
     */
    data: WorkerProfileCreateManyInput | WorkerProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WorkerProfile createManyAndReturn
   */
  export type WorkerProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * The data used to create many WorkerProfiles.
     */
    data: WorkerProfileCreateManyInput | WorkerProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkerProfile update
   */
  export type WorkerProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a WorkerProfile.
     */
    data: XOR<WorkerProfileUpdateInput, WorkerProfileUncheckedUpdateInput>
    /**
     * Choose, which WorkerProfile to update.
     */
    where: WorkerProfileWhereUniqueInput
  }

  /**
   * WorkerProfile updateMany
   */
  export type WorkerProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WorkerProfiles.
     */
    data: XOR<WorkerProfileUpdateManyMutationInput, WorkerProfileUncheckedUpdateManyInput>
    /**
     * Filter which WorkerProfiles to update
     */
    where?: WorkerProfileWhereInput
    /**
     * Limit how many WorkerProfiles to update.
     */
    limit?: number
  }

  /**
   * WorkerProfile updateManyAndReturn
   */
  export type WorkerProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * The data used to update WorkerProfiles.
     */
    data: XOR<WorkerProfileUpdateManyMutationInput, WorkerProfileUncheckedUpdateManyInput>
    /**
     * Filter which WorkerProfiles to update
     */
    where?: WorkerProfileWhereInput
    /**
     * Limit how many WorkerProfiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * WorkerProfile upsert
   */
  export type WorkerProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the WorkerProfile to update in case it exists.
     */
    where: WorkerProfileWhereUniqueInput
    /**
     * In case the WorkerProfile found by the `where` argument doesn't exist, create a new WorkerProfile with this data.
     */
    create: XOR<WorkerProfileCreateInput, WorkerProfileUncheckedCreateInput>
    /**
     * In case the WorkerProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WorkerProfileUpdateInput, WorkerProfileUncheckedUpdateInput>
  }

  /**
   * WorkerProfile delete
   */
  export type WorkerProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
    /**
     * Filter which WorkerProfile to delete.
     */
    where: WorkerProfileWhereUniqueInput
  }

  /**
   * WorkerProfile deleteMany
   */
  export type WorkerProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WorkerProfiles to delete
     */
    where?: WorkerProfileWhereInput
    /**
     * Limit how many WorkerProfiles to delete.
     */
    limit?: number
  }

  /**
   * WorkerProfile.verificationRequirements
   */
  export type WorkerProfile$verificationRequirementsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    where?: VerificationRequirementWhereInput
    orderBy?: VerificationRequirementOrderByWithRelationInput | VerificationRequirementOrderByWithRelationInput[]
    cursor?: VerificationRequirementWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VerificationRequirementScalarFieldEnum | VerificationRequirementScalarFieldEnum[]
  }

  /**
   * WorkerProfile without action
   */
  export type WorkerProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WorkerProfile
     */
    select?: WorkerProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WorkerProfile
     */
    omit?: WorkerProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: WorkerProfileInclude<ExtArgs> | null
  }


  /**
   * Model VerificationRequirement
   */

  export type AggregateVerificationRequirement = {
    _count: VerificationRequirementCountAggregateOutputType | null
    _min: VerificationRequirementMinAggregateOutputType | null
    _max: VerificationRequirementMaxAggregateOutputType | null
  }

  export type VerificationRequirementMinAggregateOutputType = {
    id: string | null
    workerProfileId: string | null
    requirementType: string | null
    requirementName: string | null
    documentCategory: $Enums.DocumentCategory | null
    isRequired: boolean | null
    status: $Enums.RequirementStatus | null
    documentUrl: string | null
    documentUploadedAt: Date | null
    submittedAt: Date | null
    reviewedAt: Date | null
    reviewedBy: string | null
    approvedAt: Date | null
    rejectedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    rejectionReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationRequirementMaxAggregateOutputType = {
    id: string | null
    workerProfileId: string | null
    requirementType: string | null
    requirementName: string | null
    documentCategory: $Enums.DocumentCategory | null
    isRequired: boolean | null
    status: $Enums.RequirementStatus | null
    documentUrl: string | null
    documentUploadedAt: Date | null
    submittedAt: Date | null
    reviewedAt: Date | null
    reviewedBy: string | null
    approvedAt: Date | null
    rejectedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    rejectionReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type VerificationRequirementCountAggregateOutputType = {
    id: number
    workerProfileId: number
    requirementType: number
    requirementName: number
    documentCategory: number
    isRequired: number
    status: number
    documentUrl: number
    documentUploadedAt: number
    submittedAt: number
    reviewedAt: number
    reviewedBy: number
    approvedAt: number
    rejectedAt: number
    expiresAt: number
    notes: number
    rejectionReason: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type VerificationRequirementMinAggregateInputType = {
    id?: true
    workerProfileId?: true
    requirementType?: true
    requirementName?: true
    documentCategory?: true
    isRequired?: true
    status?: true
    documentUrl?: true
    documentUploadedAt?: true
    submittedAt?: true
    reviewedAt?: true
    reviewedBy?: true
    approvedAt?: true
    rejectedAt?: true
    expiresAt?: true
    notes?: true
    rejectionReason?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationRequirementMaxAggregateInputType = {
    id?: true
    workerProfileId?: true
    requirementType?: true
    requirementName?: true
    documentCategory?: true
    isRequired?: true
    status?: true
    documentUrl?: true
    documentUploadedAt?: true
    submittedAt?: true
    reviewedAt?: true
    reviewedBy?: true
    approvedAt?: true
    rejectedAt?: true
    expiresAt?: true
    notes?: true
    rejectionReason?: true
    createdAt?: true
    updatedAt?: true
  }

  export type VerificationRequirementCountAggregateInputType = {
    id?: true
    workerProfileId?: true
    requirementType?: true
    requirementName?: true
    documentCategory?: true
    isRequired?: true
    status?: true
    documentUrl?: true
    documentUploadedAt?: true
    submittedAt?: true
    reviewedAt?: true
    reviewedBy?: true
    approvedAt?: true
    rejectedAt?: true
    expiresAt?: true
    notes?: true
    rejectionReason?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type VerificationRequirementAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationRequirement to aggregate.
     */
    where?: VerificationRequirementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationRequirements to fetch.
     */
    orderBy?: VerificationRequirementOrderByWithRelationInput | VerificationRequirementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationRequirementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationRequirements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationRequirements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationRequirements
    **/
    _count?: true | VerificationRequirementCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationRequirementMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationRequirementMaxAggregateInputType
  }

  export type GetVerificationRequirementAggregateType<T extends VerificationRequirementAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationRequirement]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationRequirement[P]>
      : GetScalarType<T[P], AggregateVerificationRequirement[P]>
  }




  export type VerificationRequirementGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationRequirementWhereInput
    orderBy?: VerificationRequirementOrderByWithAggregationInput | VerificationRequirementOrderByWithAggregationInput[]
    by: VerificationRequirementScalarFieldEnum[] | VerificationRequirementScalarFieldEnum
    having?: VerificationRequirementScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationRequirementCountAggregateInputType | true
    _min?: VerificationRequirementMinAggregateInputType
    _max?: VerificationRequirementMaxAggregateInputType
  }

  export type VerificationRequirementGroupByOutputType = {
    id: string
    workerProfileId: string
    requirementType: string
    requirementName: string
    documentCategory: $Enums.DocumentCategory | null
    isRequired: boolean
    status: $Enums.RequirementStatus
    documentUrl: string | null
    documentUploadedAt: Date | null
    submittedAt: Date | null
    reviewedAt: Date | null
    reviewedBy: string | null
    approvedAt: Date | null
    rejectedAt: Date | null
    expiresAt: Date | null
    notes: string | null
    rejectionReason: string | null
    createdAt: Date
    updatedAt: Date
    _count: VerificationRequirementCountAggregateOutputType | null
    _min: VerificationRequirementMinAggregateOutputType | null
    _max: VerificationRequirementMaxAggregateOutputType | null
  }

  type GetVerificationRequirementGroupByPayload<T extends VerificationRequirementGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationRequirementGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationRequirementGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationRequirementGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationRequirementGroupByOutputType[P]>
        }
      >
    >


  export type VerificationRequirementSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerProfileId?: boolean
    requirementType?: boolean
    requirementName?: boolean
    documentCategory?: boolean
    isRequired?: boolean
    status?: boolean
    documentUrl?: boolean
    documentUploadedAt?: boolean
    submittedAt?: boolean
    reviewedAt?: boolean
    reviewedBy?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    rejectionReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationRequirement"]>

  export type VerificationRequirementSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerProfileId?: boolean
    requirementType?: boolean
    requirementName?: boolean
    documentCategory?: boolean
    isRequired?: boolean
    status?: boolean
    documentUrl?: boolean
    documentUploadedAt?: boolean
    submittedAt?: boolean
    reviewedAt?: boolean
    reviewedBy?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    rejectionReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationRequirement"]>

  export type VerificationRequirementSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerProfileId?: boolean
    requirementType?: boolean
    requirementName?: boolean
    documentCategory?: boolean
    isRequired?: boolean
    status?: boolean
    documentUrl?: boolean
    documentUploadedAt?: boolean
    submittedAt?: boolean
    reviewedAt?: boolean
    reviewedBy?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    rejectionReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["verificationRequirement"]>

  export type VerificationRequirementSelectScalar = {
    id?: boolean
    workerProfileId?: boolean
    requirementType?: boolean
    requirementName?: boolean
    documentCategory?: boolean
    isRequired?: boolean
    status?: boolean
    documentUrl?: boolean
    documentUploadedAt?: boolean
    submittedAt?: boolean
    reviewedAt?: boolean
    reviewedBy?: boolean
    approvedAt?: boolean
    rejectedAt?: boolean
    expiresAt?: boolean
    notes?: boolean
    rejectionReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type VerificationRequirementOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "workerProfileId" | "requirementType" | "requirementName" | "documentCategory" | "isRequired" | "status" | "documentUrl" | "documentUploadedAt" | "submittedAt" | "reviewedAt" | "reviewedBy" | "approvedAt" | "rejectedAt" | "expiresAt" | "notes" | "rejectionReason" | "createdAt" | "updatedAt", ExtArgs["result"]["verificationRequirement"]>
  export type VerificationRequirementInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }
  export type VerificationRequirementIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }
  export type VerificationRequirementIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    workerProfile?: boolean | WorkerProfileDefaultArgs<ExtArgs>
  }

  export type $VerificationRequirementPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationRequirement"
    objects: {
      workerProfile: Prisma.$WorkerProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workerProfileId: string
      requirementType: string
      requirementName: string
      documentCategory: $Enums.DocumentCategory | null
      isRequired: boolean
      status: $Enums.RequirementStatus
      documentUrl: string | null
      documentUploadedAt: Date | null
      submittedAt: Date | null
      reviewedAt: Date | null
      reviewedBy: string | null
      approvedAt: Date | null
      rejectedAt: Date | null
      expiresAt: Date | null
      notes: string | null
      rejectionReason: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["verificationRequirement"]>
    composites: {}
  }

  type VerificationRequirementGetPayload<S extends boolean | null | undefined | VerificationRequirementDefaultArgs> = $Result.GetResult<Prisma.$VerificationRequirementPayload, S>

  type VerificationRequirementCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationRequirementFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationRequirementCountAggregateInputType | true
    }

  export interface VerificationRequirementDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationRequirement'], meta: { name: 'VerificationRequirement' } }
    /**
     * Find zero or one VerificationRequirement that matches the filter.
     * @param {VerificationRequirementFindUniqueArgs} args - Arguments to find a VerificationRequirement
     * @example
     * // Get one VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationRequirementFindUniqueArgs>(args: SelectSubset<T, VerificationRequirementFindUniqueArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationRequirement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationRequirementFindUniqueOrThrowArgs} args - Arguments to find a VerificationRequirement
     * @example
     * // Get one VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationRequirementFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationRequirementFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationRequirement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementFindFirstArgs} args - Arguments to find a VerificationRequirement
     * @example
     * // Get one VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationRequirementFindFirstArgs>(args?: SelectSubset<T, VerificationRequirementFindFirstArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationRequirement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementFindFirstOrThrowArgs} args - Arguments to find a VerificationRequirement
     * @example
     * // Get one VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationRequirementFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationRequirementFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationRequirements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationRequirements
     * const verificationRequirements = await prisma.verificationRequirement.findMany()
     * 
     * // Get first 10 VerificationRequirements
     * const verificationRequirements = await prisma.verificationRequirement.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationRequirementWithIdOnly = await prisma.verificationRequirement.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationRequirementFindManyArgs>(args?: SelectSubset<T, VerificationRequirementFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationRequirement.
     * @param {VerificationRequirementCreateArgs} args - Arguments to create a VerificationRequirement.
     * @example
     * // Create one VerificationRequirement
     * const VerificationRequirement = await prisma.verificationRequirement.create({
     *   data: {
     *     // ... data to create a VerificationRequirement
     *   }
     * })
     * 
     */
    create<T extends VerificationRequirementCreateArgs>(args: SelectSubset<T, VerificationRequirementCreateArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationRequirements.
     * @param {VerificationRequirementCreateManyArgs} args - Arguments to create many VerificationRequirements.
     * @example
     * // Create many VerificationRequirements
     * const verificationRequirement = await prisma.verificationRequirement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationRequirementCreateManyArgs>(args?: SelectSubset<T, VerificationRequirementCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationRequirements and returns the data saved in the database.
     * @param {VerificationRequirementCreateManyAndReturnArgs} args - Arguments to create many VerificationRequirements.
     * @example
     * // Create many VerificationRequirements
     * const verificationRequirement = await prisma.verificationRequirement.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationRequirements and only return the `id`
     * const verificationRequirementWithIdOnly = await prisma.verificationRequirement.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationRequirementCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationRequirementCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationRequirement.
     * @param {VerificationRequirementDeleteArgs} args - Arguments to delete one VerificationRequirement.
     * @example
     * // Delete one VerificationRequirement
     * const VerificationRequirement = await prisma.verificationRequirement.delete({
     *   where: {
     *     // ... filter to delete one VerificationRequirement
     *   }
     * })
     * 
     */
    delete<T extends VerificationRequirementDeleteArgs>(args: SelectSubset<T, VerificationRequirementDeleteArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationRequirement.
     * @param {VerificationRequirementUpdateArgs} args - Arguments to update one VerificationRequirement.
     * @example
     * // Update one VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationRequirementUpdateArgs>(args: SelectSubset<T, VerificationRequirementUpdateArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationRequirements.
     * @param {VerificationRequirementDeleteManyArgs} args - Arguments to filter VerificationRequirements to delete.
     * @example
     * // Delete a few VerificationRequirements
     * const { count } = await prisma.verificationRequirement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationRequirementDeleteManyArgs>(args?: SelectSubset<T, VerificationRequirementDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationRequirements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationRequirements
     * const verificationRequirement = await prisma.verificationRequirement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationRequirementUpdateManyArgs>(args: SelectSubset<T, VerificationRequirementUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationRequirements and returns the data updated in the database.
     * @param {VerificationRequirementUpdateManyAndReturnArgs} args - Arguments to update many VerificationRequirements.
     * @example
     * // Update many VerificationRequirements
     * const verificationRequirement = await prisma.verificationRequirement.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationRequirements and only return the `id`
     * const verificationRequirementWithIdOnly = await prisma.verificationRequirement.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationRequirementUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationRequirementUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationRequirement.
     * @param {VerificationRequirementUpsertArgs} args - Arguments to update or create a VerificationRequirement.
     * @example
     * // Update or create a VerificationRequirement
     * const verificationRequirement = await prisma.verificationRequirement.upsert({
     *   create: {
     *     // ... data to create a VerificationRequirement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationRequirement we want to update
     *   }
     * })
     */
    upsert<T extends VerificationRequirementUpsertArgs>(args: SelectSubset<T, VerificationRequirementUpsertArgs<ExtArgs>>): Prisma__VerificationRequirementClient<$Result.GetResult<Prisma.$VerificationRequirementPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationRequirements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementCountArgs} args - Arguments to filter VerificationRequirements to count.
     * @example
     * // Count the number of VerificationRequirements
     * const count = await prisma.verificationRequirement.count({
     *   where: {
     *     // ... the filter for the VerificationRequirements we want to count
     *   }
     * })
    **/
    count<T extends VerificationRequirementCountArgs>(
      args?: Subset<T, VerificationRequirementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationRequirementCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationRequirement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationRequirementAggregateArgs>(args: Subset<T, VerificationRequirementAggregateArgs>): Prisma.PrismaPromise<GetVerificationRequirementAggregateType<T>>

    /**
     * Group by VerificationRequirement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationRequirementGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationRequirementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationRequirementGroupByArgs['orderBy'] }
        : { orderBy?: VerificationRequirementGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationRequirementGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationRequirementGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationRequirement model
   */
  readonly fields: VerificationRequirementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationRequirement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationRequirementClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    workerProfile<T extends WorkerProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, WorkerProfileDefaultArgs<ExtArgs>>): Prisma__WorkerProfileClient<$Result.GetResult<Prisma.$WorkerProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationRequirement model
   */
  interface VerificationRequirementFieldRefs {
    readonly id: FieldRef<"VerificationRequirement", 'String'>
    readonly workerProfileId: FieldRef<"VerificationRequirement", 'String'>
    readonly requirementType: FieldRef<"VerificationRequirement", 'String'>
    readonly requirementName: FieldRef<"VerificationRequirement", 'String'>
    readonly documentCategory: FieldRef<"VerificationRequirement", 'DocumentCategory'>
    readonly isRequired: FieldRef<"VerificationRequirement", 'Boolean'>
    readonly status: FieldRef<"VerificationRequirement", 'RequirementStatus'>
    readonly documentUrl: FieldRef<"VerificationRequirement", 'String'>
    readonly documentUploadedAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly submittedAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly reviewedAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly reviewedBy: FieldRef<"VerificationRequirement", 'String'>
    readonly approvedAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly rejectedAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly expiresAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly notes: FieldRef<"VerificationRequirement", 'String'>
    readonly rejectionReason: FieldRef<"VerificationRequirement", 'String'>
    readonly createdAt: FieldRef<"VerificationRequirement", 'DateTime'>
    readonly updatedAt: FieldRef<"VerificationRequirement", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationRequirement findUnique
   */
  export type VerificationRequirementFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter, which VerificationRequirement to fetch.
     */
    where: VerificationRequirementWhereUniqueInput
  }

  /**
   * VerificationRequirement findUniqueOrThrow
   */
  export type VerificationRequirementFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter, which VerificationRequirement to fetch.
     */
    where: VerificationRequirementWhereUniqueInput
  }

  /**
   * VerificationRequirement findFirst
   */
  export type VerificationRequirementFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter, which VerificationRequirement to fetch.
     */
    where?: VerificationRequirementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationRequirements to fetch.
     */
    orderBy?: VerificationRequirementOrderByWithRelationInput | VerificationRequirementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationRequirements.
     */
    cursor?: VerificationRequirementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationRequirements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationRequirements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationRequirements.
     */
    distinct?: VerificationRequirementScalarFieldEnum | VerificationRequirementScalarFieldEnum[]
  }

  /**
   * VerificationRequirement findFirstOrThrow
   */
  export type VerificationRequirementFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter, which VerificationRequirement to fetch.
     */
    where?: VerificationRequirementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationRequirements to fetch.
     */
    orderBy?: VerificationRequirementOrderByWithRelationInput | VerificationRequirementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationRequirements.
     */
    cursor?: VerificationRequirementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationRequirements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationRequirements.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationRequirements.
     */
    distinct?: VerificationRequirementScalarFieldEnum | VerificationRequirementScalarFieldEnum[]
  }

  /**
   * VerificationRequirement findMany
   */
  export type VerificationRequirementFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter, which VerificationRequirements to fetch.
     */
    where?: VerificationRequirementWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationRequirements to fetch.
     */
    orderBy?: VerificationRequirementOrderByWithRelationInput | VerificationRequirementOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationRequirements.
     */
    cursor?: VerificationRequirementWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationRequirements from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationRequirements.
     */
    skip?: number
    distinct?: VerificationRequirementScalarFieldEnum | VerificationRequirementScalarFieldEnum[]
  }

  /**
   * VerificationRequirement create
   */
  export type VerificationRequirementCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * The data needed to create a VerificationRequirement.
     */
    data: XOR<VerificationRequirementCreateInput, VerificationRequirementUncheckedCreateInput>
  }

  /**
   * VerificationRequirement createMany
   */
  export type VerificationRequirementCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationRequirements.
     */
    data: VerificationRequirementCreateManyInput | VerificationRequirementCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationRequirement createManyAndReturn
   */
  export type VerificationRequirementCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationRequirements.
     */
    data: VerificationRequirementCreateManyInput | VerificationRequirementCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationRequirement update
   */
  export type VerificationRequirementUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * The data needed to update a VerificationRequirement.
     */
    data: XOR<VerificationRequirementUpdateInput, VerificationRequirementUncheckedUpdateInput>
    /**
     * Choose, which VerificationRequirement to update.
     */
    where: VerificationRequirementWhereUniqueInput
  }

  /**
   * VerificationRequirement updateMany
   */
  export type VerificationRequirementUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationRequirements.
     */
    data: XOR<VerificationRequirementUpdateManyMutationInput, VerificationRequirementUncheckedUpdateManyInput>
    /**
     * Filter which VerificationRequirements to update
     */
    where?: VerificationRequirementWhereInput
    /**
     * Limit how many VerificationRequirements to update.
     */
    limit?: number
  }

  /**
   * VerificationRequirement updateManyAndReturn
   */
  export type VerificationRequirementUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * The data used to update VerificationRequirements.
     */
    data: XOR<VerificationRequirementUpdateManyMutationInput, VerificationRequirementUncheckedUpdateManyInput>
    /**
     * Filter which VerificationRequirements to update
     */
    where?: VerificationRequirementWhereInput
    /**
     * Limit how many VerificationRequirements to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * VerificationRequirement upsert
   */
  export type VerificationRequirementUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * The filter to search for the VerificationRequirement to update in case it exists.
     */
    where: VerificationRequirementWhereUniqueInput
    /**
     * In case the VerificationRequirement found by the `where` argument doesn't exist, create a new VerificationRequirement with this data.
     */
    create: XOR<VerificationRequirementCreateInput, VerificationRequirementUncheckedCreateInput>
    /**
     * In case the VerificationRequirement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationRequirementUpdateInput, VerificationRequirementUncheckedUpdateInput>
  }

  /**
   * VerificationRequirement delete
   */
  export type VerificationRequirementDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
    /**
     * Filter which VerificationRequirement to delete.
     */
    where: VerificationRequirementWhereUniqueInput
  }

  /**
   * VerificationRequirement deleteMany
   */
  export type VerificationRequirementDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationRequirements to delete
     */
    where?: VerificationRequirementWhereInput
    /**
     * Limit how many VerificationRequirements to delete.
     */
    limit?: number
  }

  /**
   * VerificationRequirement without action
   */
  export type VerificationRequirementDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationRequirement
     */
    select?: VerificationRequirementSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationRequirement
     */
    omit?: VerificationRequirementOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VerificationRequirementInclude<ExtArgs> | null
  }


  /**
   * Model ClientProfile
   */

  export type AggregateClientProfile = {
    _count: ClientProfileCountAggregateOutputType | null
    _min: ClientProfileMinAggregateOutputType | null
    _max: ClientProfileMaxAggregateOutputType | null
  }

  export type ClientProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    lastName: string | null
    mobile: string | null
    location: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClientProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    lastName: string | null
    mobile: string | null
    location: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ClientProfileCountAggregateOutputType = {
    id: number
    userId: number
    firstName: number
    lastName: number
    mobile: number
    location: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ClientProfileMinAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    location?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClientProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    location?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ClientProfileCountAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    location?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ClientProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ClientProfile to aggregate.
     */
    where?: ClientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ClientProfiles to fetch.
     */
    orderBy?: ClientProfileOrderByWithRelationInput | ClientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ClientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ClientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ClientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ClientProfiles
    **/
    _count?: true | ClientProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ClientProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ClientProfileMaxAggregateInputType
  }

  export type GetClientProfileAggregateType<T extends ClientProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateClientProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateClientProfile[P]>
      : GetScalarType<T[P], AggregateClientProfile[P]>
  }




  export type ClientProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ClientProfileWhereInput
    orderBy?: ClientProfileOrderByWithAggregationInput | ClientProfileOrderByWithAggregationInput[]
    by: ClientProfileScalarFieldEnum[] | ClientProfileScalarFieldEnum
    having?: ClientProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ClientProfileCountAggregateInputType | true
    _min?: ClientProfileMinAggregateInputType
    _max?: ClientProfileMaxAggregateInputType
  }

  export type ClientProfileGroupByOutputType = {
    id: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    location: string | null
    createdAt: Date
    updatedAt: Date
    _count: ClientProfileCountAggregateOutputType | null
    _min: ClientProfileMinAggregateOutputType | null
    _max: ClientProfileMaxAggregateOutputType | null
  }

  type GetClientProfileGroupByPayload<T extends ClientProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ClientProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ClientProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClientProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ClientProfileGroupByOutputType[P]>
        }
      >
    >


  export type ClientProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["clientProfile"]>

  export type ClientProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["clientProfile"]>

  export type ClientProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["clientProfile"]>

  export type ClientProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ClientProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "firstName" | "lastName" | "mobile" | "location" | "createdAt" | "updatedAt", ExtArgs["result"]["clientProfile"]>
  export type ClientProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ClientProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type ClientProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $ClientProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ClientProfile"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      firstName: string
      lastName: string
      mobile: string
      location: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["clientProfile"]>
    composites: {}
  }

  type ClientProfileGetPayload<S extends boolean | null | undefined | ClientProfileDefaultArgs> = $Result.GetResult<Prisma.$ClientProfilePayload, S>

  type ClientProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ClientProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ClientProfileCountAggregateInputType | true
    }

  export interface ClientProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ClientProfile'], meta: { name: 'ClientProfile' } }
    /**
     * Find zero or one ClientProfile that matches the filter.
     * @param {ClientProfileFindUniqueArgs} args - Arguments to find a ClientProfile
     * @example
     * // Get one ClientProfile
     * const clientProfile = await prisma.clientProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClientProfileFindUniqueArgs>(args: SelectSubset<T, ClientProfileFindUniqueArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ClientProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClientProfileFindUniqueOrThrowArgs} args - Arguments to find a ClientProfile
     * @example
     * // Get one ClientProfile
     * const clientProfile = await prisma.clientProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClientProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, ClientProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ClientProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileFindFirstArgs} args - Arguments to find a ClientProfile
     * @example
     * // Get one ClientProfile
     * const clientProfile = await prisma.clientProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClientProfileFindFirstArgs>(args?: SelectSubset<T, ClientProfileFindFirstArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ClientProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileFindFirstOrThrowArgs} args - Arguments to find a ClientProfile
     * @example
     * // Get one ClientProfile
     * const clientProfile = await prisma.clientProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClientProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, ClientProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ClientProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ClientProfiles
     * const clientProfiles = await prisma.clientProfile.findMany()
     * 
     * // Get first 10 ClientProfiles
     * const clientProfiles = await prisma.clientProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const clientProfileWithIdOnly = await prisma.clientProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ClientProfileFindManyArgs>(args?: SelectSubset<T, ClientProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ClientProfile.
     * @param {ClientProfileCreateArgs} args - Arguments to create a ClientProfile.
     * @example
     * // Create one ClientProfile
     * const ClientProfile = await prisma.clientProfile.create({
     *   data: {
     *     // ... data to create a ClientProfile
     *   }
     * })
     * 
     */
    create<T extends ClientProfileCreateArgs>(args: SelectSubset<T, ClientProfileCreateArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ClientProfiles.
     * @param {ClientProfileCreateManyArgs} args - Arguments to create many ClientProfiles.
     * @example
     * // Create many ClientProfiles
     * const clientProfile = await prisma.clientProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ClientProfileCreateManyArgs>(args?: SelectSubset<T, ClientProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ClientProfiles and returns the data saved in the database.
     * @param {ClientProfileCreateManyAndReturnArgs} args - Arguments to create many ClientProfiles.
     * @example
     * // Create many ClientProfiles
     * const clientProfile = await prisma.clientProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ClientProfiles and only return the `id`
     * const clientProfileWithIdOnly = await prisma.clientProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ClientProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, ClientProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ClientProfile.
     * @param {ClientProfileDeleteArgs} args - Arguments to delete one ClientProfile.
     * @example
     * // Delete one ClientProfile
     * const ClientProfile = await prisma.clientProfile.delete({
     *   where: {
     *     // ... filter to delete one ClientProfile
     *   }
     * })
     * 
     */
    delete<T extends ClientProfileDeleteArgs>(args: SelectSubset<T, ClientProfileDeleteArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ClientProfile.
     * @param {ClientProfileUpdateArgs} args - Arguments to update one ClientProfile.
     * @example
     * // Update one ClientProfile
     * const clientProfile = await prisma.clientProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ClientProfileUpdateArgs>(args: SelectSubset<T, ClientProfileUpdateArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ClientProfiles.
     * @param {ClientProfileDeleteManyArgs} args - Arguments to filter ClientProfiles to delete.
     * @example
     * // Delete a few ClientProfiles
     * const { count } = await prisma.clientProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ClientProfileDeleteManyArgs>(args?: SelectSubset<T, ClientProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ClientProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ClientProfiles
     * const clientProfile = await prisma.clientProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ClientProfileUpdateManyArgs>(args: SelectSubset<T, ClientProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ClientProfiles and returns the data updated in the database.
     * @param {ClientProfileUpdateManyAndReturnArgs} args - Arguments to update many ClientProfiles.
     * @example
     * // Update many ClientProfiles
     * const clientProfile = await prisma.clientProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ClientProfiles and only return the `id`
     * const clientProfileWithIdOnly = await prisma.clientProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ClientProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, ClientProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ClientProfile.
     * @param {ClientProfileUpsertArgs} args - Arguments to update or create a ClientProfile.
     * @example
     * // Update or create a ClientProfile
     * const clientProfile = await prisma.clientProfile.upsert({
     *   create: {
     *     // ... data to create a ClientProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ClientProfile we want to update
     *   }
     * })
     */
    upsert<T extends ClientProfileUpsertArgs>(args: SelectSubset<T, ClientProfileUpsertArgs<ExtArgs>>): Prisma__ClientProfileClient<$Result.GetResult<Prisma.$ClientProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ClientProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileCountArgs} args - Arguments to filter ClientProfiles to count.
     * @example
     * // Count the number of ClientProfiles
     * const count = await prisma.clientProfile.count({
     *   where: {
     *     // ... the filter for the ClientProfiles we want to count
     *   }
     * })
    **/
    count<T extends ClientProfileCountArgs>(
      args?: Subset<T, ClientProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClientProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ClientProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ClientProfileAggregateArgs>(args: Subset<T, ClientProfileAggregateArgs>): Prisma.PrismaPromise<GetClientProfileAggregateType<T>>

    /**
     * Group by ClientProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClientProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ClientProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClientProfileGroupByArgs['orderBy'] }
        : { orderBy?: ClientProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ClientProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetClientProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ClientProfile model
   */
  readonly fields: ClientProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ClientProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClientProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ClientProfile model
   */
  interface ClientProfileFieldRefs {
    readonly id: FieldRef<"ClientProfile", 'String'>
    readonly userId: FieldRef<"ClientProfile", 'String'>
    readonly firstName: FieldRef<"ClientProfile", 'String'>
    readonly lastName: FieldRef<"ClientProfile", 'String'>
    readonly mobile: FieldRef<"ClientProfile", 'String'>
    readonly location: FieldRef<"ClientProfile", 'String'>
    readonly createdAt: FieldRef<"ClientProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"ClientProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ClientProfile findUnique
   */
  export type ClientProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter, which ClientProfile to fetch.
     */
    where: ClientProfileWhereUniqueInput
  }

  /**
   * ClientProfile findUniqueOrThrow
   */
  export type ClientProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter, which ClientProfile to fetch.
     */
    where: ClientProfileWhereUniqueInput
  }

  /**
   * ClientProfile findFirst
   */
  export type ClientProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter, which ClientProfile to fetch.
     */
    where?: ClientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ClientProfiles to fetch.
     */
    orderBy?: ClientProfileOrderByWithRelationInput | ClientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ClientProfiles.
     */
    cursor?: ClientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ClientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ClientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ClientProfiles.
     */
    distinct?: ClientProfileScalarFieldEnum | ClientProfileScalarFieldEnum[]
  }

  /**
   * ClientProfile findFirstOrThrow
   */
  export type ClientProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter, which ClientProfile to fetch.
     */
    where?: ClientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ClientProfiles to fetch.
     */
    orderBy?: ClientProfileOrderByWithRelationInput | ClientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ClientProfiles.
     */
    cursor?: ClientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ClientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ClientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ClientProfiles.
     */
    distinct?: ClientProfileScalarFieldEnum | ClientProfileScalarFieldEnum[]
  }

  /**
   * ClientProfile findMany
   */
  export type ClientProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter, which ClientProfiles to fetch.
     */
    where?: ClientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ClientProfiles to fetch.
     */
    orderBy?: ClientProfileOrderByWithRelationInput | ClientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ClientProfiles.
     */
    cursor?: ClientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ClientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ClientProfiles.
     */
    skip?: number
    distinct?: ClientProfileScalarFieldEnum | ClientProfileScalarFieldEnum[]
  }

  /**
   * ClientProfile create
   */
  export type ClientProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a ClientProfile.
     */
    data: XOR<ClientProfileCreateInput, ClientProfileUncheckedCreateInput>
  }

  /**
   * ClientProfile createMany
   */
  export type ClientProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ClientProfiles.
     */
    data: ClientProfileCreateManyInput | ClientProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ClientProfile createManyAndReturn
   */
  export type ClientProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * The data used to create many ClientProfiles.
     */
    data: ClientProfileCreateManyInput | ClientProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ClientProfile update
   */
  export type ClientProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a ClientProfile.
     */
    data: XOR<ClientProfileUpdateInput, ClientProfileUncheckedUpdateInput>
    /**
     * Choose, which ClientProfile to update.
     */
    where: ClientProfileWhereUniqueInput
  }

  /**
   * ClientProfile updateMany
   */
  export type ClientProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ClientProfiles.
     */
    data: XOR<ClientProfileUpdateManyMutationInput, ClientProfileUncheckedUpdateManyInput>
    /**
     * Filter which ClientProfiles to update
     */
    where?: ClientProfileWhereInput
    /**
     * Limit how many ClientProfiles to update.
     */
    limit?: number
  }

  /**
   * ClientProfile updateManyAndReturn
   */
  export type ClientProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * The data used to update ClientProfiles.
     */
    data: XOR<ClientProfileUpdateManyMutationInput, ClientProfileUncheckedUpdateManyInput>
    /**
     * Filter which ClientProfiles to update
     */
    where?: ClientProfileWhereInput
    /**
     * Limit how many ClientProfiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ClientProfile upsert
   */
  export type ClientProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the ClientProfile to update in case it exists.
     */
    where: ClientProfileWhereUniqueInput
    /**
     * In case the ClientProfile found by the `where` argument doesn't exist, create a new ClientProfile with this data.
     */
    create: XOR<ClientProfileCreateInput, ClientProfileUncheckedCreateInput>
    /**
     * In case the ClientProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClientProfileUpdateInput, ClientProfileUncheckedUpdateInput>
  }

  /**
   * ClientProfile delete
   */
  export type ClientProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
    /**
     * Filter which ClientProfile to delete.
     */
    where: ClientProfileWhereUniqueInput
  }

  /**
   * ClientProfile deleteMany
   */
  export type ClientProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ClientProfiles to delete
     */
    where?: ClientProfileWhereInput
    /**
     * Limit how many ClientProfiles to delete.
     */
    limit?: number
  }

  /**
   * ClientProfile without action
   */
  export type ClientProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClientProfile
     */
    select?: ClientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ClientProfile
     */
    omit?: ClientProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClientProfileInclude<ExtArgs> | null
  }


  /**
   * Model CoordinatorProfile
   */

  export type AggregateCoordinatorProfile = {
    _count: CoordinatorProfileCountAggregateOutputType | null
    _min: CoordinatorProfileMinAggregateOutputType | null
    _max: CoordinatorProfileMaxAggregateOutputType | null
  }

  export type CoordinatorProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    lastName: string | null
    mobile: string | null
    organization: string | null
    location: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoordinatorProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    firstName: string | null
    lastName: string | null
    mobile: string | null
    organization: string | null
    location: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoordinatorProfileCountAggregateOutputType = {
    id: number
    userId: number
    firstName: number
    lastName: number
    mobile: number
    organization: number
    location: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CoordinatorProfileMinAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    organization?: true
    location?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoordinatorProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    organization?: true
    location?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoordinatorProfileCountAggregateInputType = {
    id?: true
    userId?: true
    firstName?: true
    lastName?: true
    mobile?: true
    organization?: true
    location?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CoordinatorProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoordinatorProfile to aggregate.
     */
    where?: CoordinatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoordinatorProfiles to fetch.
     */
    orderBy?: CoordinatorProfileOrderByWithRelationInput | CoordinatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CoordinatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoordinatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoordinatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CoordinatorProfiles
    **/
    _count?: true | CoordinatorProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CoordinatorProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CoordinatorProfileMaxAggregateInputType
  }

  export type GetCoordinatorProfileAggregateType<T extends CoordinatorProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateCoordinatorProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCoordinatorProfile[P]>
      : GetScalarType<T[P], AggregateCoordinatorProfile[P]>
  }




  export type CoordinatorProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CoordinatorProfileWhereInput
    orderBy?: CoordinatorProfileOrderByWithAggregationInput | CoordinatorProfileOrderByWithAggregationInput[]
    by: CoordinatorProfileScalarFieldEnum[] | CoordinatorProfileScalarFieldEnum
    having?: CoordinatorProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CoordinatorProfileCountAggregateInputType | true
    _min?: CoordinatorProfileMinAggregateInputType
    _max?: CoordinatorProfileMaxAggregateInputType
  }

  export type CoordinatorProfileGroupByOutputType = {
    id: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    organization: string | null
    location: string | null
    createdAt: Date
    updatedAt: Date
    _count: CoordinatorProfileCountAggregateOutputType | null
    _min: CoordinatorProfileMinAggregateOutputType | null
    _max: CoordinatorProfileMaxAggregateOutputType | null
  }

  type GetCoordinatorProfileGroupByPayload<T extends CoordinatorProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CoordinatorProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CoordinatorProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CoordinatorProfileGroupByOutputType[P]>
            : GetScalarType<T[P], CoordinatorProfileGroupByOutputType[P]>
        }
      >
    >


  export type CoordinatorProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    organization?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coordinatorProfile"]>

  export type CoordinatorProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    organization?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coordinatorProfile"]>

  export type CoordinatorProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    organization?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coordinatorProfile"]>

  export type CoordinatorProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    firstName?: boolean
    lastName?: boolean
    mobile?: boolean
    organization?: boolean
    location?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CoordinatorProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "firstName" | "lastName" | "mobile" | "organization" | "location" | "createdAt" | "updatedAt", ExtArgs["result"]["coordinatorProfile"]>
  export type CoordinatorProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CoordinatorProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CoordinatorProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CoordinatorProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CoordinatorProfile"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      firstName: string
      lastName: string
      mobile: string
      organization: string | null
      location: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["coordinatorProfile"]>
    composites: {}
  }

  type CoordinatorProfileGetPayload<S extends boolean | null | undefined | CoordinatorProfileDefaultArgs> = $Result.GetResult<Prisma.$CoordinatorProfilePayload, S>

  type CoordinatorProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CoordinatorProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CoordinatorProfileCountAggregateInputType | true
    }

  export interface CoordinatorProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CoordinatorProfile'], meta: { name: 'CoordinatorProfile' } }
    /**
     * Find zero or one CoordinatorProfile that matches the filter.
     * @param {CoordinatorProfileFindUniqueArgs} args - Arguments to find a CoordinatorProfile
     * @example
     * // Get one CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CoordinatorProfileFindUniqueArgs>(args: SelectSubset<T, CoordinatorProfileFindUniqueArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CoordinatorProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CoordinatorProfileFindUniqueOrThrowArgs} args - Arguments to find a CoordinatorProfile
     * @example
     * // Get one CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CoordinatorProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, CoordinatorProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoordinatorProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileFindFirstArgs} args - Arguments to find a CoordinatorProfile
     * @example
     * // Get one CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CoordinatorProfileFindFirstArgs>(args?: SelectSubset<T, CoordinatorProfileFindFirstArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CoordinatorProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileFindFirstOrThrowArgs} args - Arguments to find a CoordinatorProfile
     * @example
     * // Get one CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CoordinatorProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, CoordinatorProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CoordinatorProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CoordinatorProfiles
     * const coordinatorProfiles = await prisma.coordinatorProfile.findMany()
     * 
     * // Get first 10 CoordinatorProfiles
     * const coordinatorProfiles = await prisma.coordinatorProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const coordinatorProfileWithIdOnly = await prisma.coordinatorProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CoordinatorProfileFindManyArgs>(args?: SelectSubset<T, CoordinatorProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CoordinatorProfile.
     * @param {CoordinatorProfileCreateArgs} args - Arguments to create a CoordinatorProfile.
     * @example
     * // Create one CoordinatorProfile
     * const CoordinatorProfile = await prisma.coordinatorProfile.create({
     *   data: {
     *     // ... data to create a CoordinatorProfile
     *   }
     * })
     * 
     */
    create<T extends CoordinatorProfileCreateArgs>(args: SelectSubset<T, CoordinatorProfileCreateArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CoordinatorProfiles.
     * @param {CoordinatorProfileCreateManyArgs} args - Arguments to create many CoordinatorProfiles.
     * @example
     * // Create many CoordinatorProfiles
     * const coordinatorProfile = await prisma.coordinatorProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CoordinatorProfileCreateManyArgs>(args?: SelectSubset<T, CoordinatorProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CoordinatorProfiles and returns the data saved in the database.
     * @param {CoordinatorProfileCreateManyAndReturnArgs} args - Arguments to create many CoordinatorProfiles.
     * @example
     * // Create many CoordinatorProfiles
     * const coordinatorProfile = await prisma.coordinatorProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CoordinatorProfiles and only return the `id`
     * const coordinatorProfileWithIdOnly = await prisma.coordinatorProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CoordinatorProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, CoordinatorProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CoordinatorProfile.
     * @param {CoordinatorProfileDeleteArgs} args - Arguments to delete one CoordinatorProfile.
     * @example
     * // Delete one CoordinatorProfile
     * const CoordinatorProfile = await prisma.coordinatorProfile.delete({
     *   where: {
     *     // ... filter to delete one CoordinatorProfile
     *   }
     * })
     * 
     */
    delete<T extends CoordinatorProfileDeleteArgs>(args: SelectSubset<T, CoordinatorProfileDeleteArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CoordinatorProfile.
     * @param {CoordinatorProfileUpdateArgs} args - Arguments to update one CoordinatorProfile.
     * @example
     * // Update one CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CoordinatorProfileUpdateArgs>(args: SelectSubset<T, CoordinatorProfileUpdateArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CoordinatorProfiles.
     * @param {CoordinatorProfileDeleteManyArgs} args - Arguments to filter CoordinatorProfiles to delete.
     * @example
     * // Delete a few CoordinatorProfiles
     * const { count } = await prisma.coordinatorProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CoordinatorProfileDeleteManyArgs>(args?: SelectSubset<T, CoordinatorProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CoordinatorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CoordinatorProfiles
     * const coordinatorProfile = await prisma.coordinatorProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CoordinatorProfileUpdateManyArgs>(args: SelectSubset<T, CoordinatorProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CoordinatorProfiles and returns the data updated in the database.
     * @param {CoordinatorProfileUpdateManyAndReturnArgs} args - Arguments to update many CoordinatorProfiles.
     * @example
     * // Update many CoordinatorProfiles
     * const coordinatorProfile = await prisma.coordinatorProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CoordinatorProfiles and only return the `id`
     * const coordinatorProfileWithIdOnly = await prisma.coordinatorProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CoordinatorProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, CoordinatorProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CoordinatorProfile.
     * @param {CoordinatorProfileUpsertArgs} args - Arguments to update or create a CoordinatorProfile.
     * @example
     * // Update or create a CoordinatorProfile
     * const coordinatorProfile = await prisma.coordinatorProfile.upsert({
     *   create: {
     *     // ... data to create a CoordinatorProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CoordinatorProfile we want to update
     *   }
     * })
     */
    upsert<T extends CoordinatorProfileUpsertArgs>(args: SelectSubset<T, CoordinatorProfileUpsertArgs<ExtArgs>>): Prisma__CoordinatorProfileClient<$Result.GetResult<Prisma.$CoordinatorProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CoordinatorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileCountArgs} args - Arguments to filter CoordinatorProfiles to count.
     * @example
     * // Count the number of CoordinatorProfiles
     * const count = await prisma.coordinatorProfile.count({
     *   where: {
     *     // ... the filter for the CoordinatorProfiles we want to count
     *   }
     * })
    **/
    count<T extends CoordinatorProfileCountArgs>(
      args?: Subset<T, CoordinatorProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CoordinatorProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CoordinatorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CoordinatorProfileAggregateArgs>(args: Subset<T, CoordinatorProfileAggregateArgs>): Prisma.PrismaPromise<GetCoordinatorProfileAggregateType<T>>

    /**
     * Group by CoordinatorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoordinatorProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CoordinatorProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CoordinatorProfileGroupByArgs['orderBy'] }
        : { orderBy?: CoordinatorProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CoordinatorProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCoordinatorProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CoordinatorProfile model
   */
  readonly fields: CoordinatorProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CoordinatorProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CoordinatorProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CoordinatorProfile model
   */
  interface CoordinatorProfileFieldRefs {
    readonly id: FieldRef<"CoordinatorProfile", 'String'>
    readonly userId: FieldRef<"CoordinatorProfile", 'String'>
    readonly firstName: FieldRef<"CoordinatorProfile", 'String'>
    readonly lastName: FieldRef<"CoordinatorProfile", 'String'>
    readonly mobile: FieldRef<"CoordinatorProfile", 'String'>
    readonly organization: FieldRef<"CoordinatorProfile", 'String'>
    readonly location: FieldRef<"CoordinatorProfile", 'String'>
    readonly createdAt: FieldRef<"CoordinatorProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"CoordinatorProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CoordinatorProfile findUnique
   */
  export type CoordinatorProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CoordinatorProfile to fetch.
     */
    where: CoordinatorProfileWhereUniqueInput
  }

  /**
   * CoordinatorProfile findUniqueOrThrow
   */
  export type CoordinatorProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CoordinatorProfile to fetch.
     */
    where: CoordinatorProfileWhereUniqueInput
  }

  /**
   * CoordinatorProfile findFirst
   */
  export type CoordinatorProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CoordinatorProfile to fetch.
     */
    where?: CoordinatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoordinatorProfiles to fetch.
     */
    orderBy?: CoordinatorProfileOrderByWithRelationInput | CoordinatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoordinatorProfiles.
     */
    cursor?: CoordinatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoordinatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoordinatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoordinatorProfiles.
     */
    distinct?: CoordinatorProfileScalarFieldEnum | CoordinatorProfileScalarFieldEnum[]
  }

  /**
   * CoordinatorProfile findFirstOrThrow
   */
  export type CoordinatorProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CoordinatorProfile to fetch.
     */
    where?: CoordinatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoordinatorProfiles to fetch.
     */
    orderBy?: CoordinatorProfileOrderByWithRelationInput | CoordinatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CoordinatorProfiles.
     */
    cursor?: CoordinatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoordinatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoordinatorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CoordinatorProfiles.
     */
    distinct?: CoordinatorProfileScalarFieldEnum | CoordinatorProfileScalarFieldEnum[]
  }

  /**
   * CoordinatorProfile findMany
   */
  export type CoordinatorProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter, which CoordinatorProfiles to fetch.
     */
    where?: CoordinatorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CoordinatorProfiles to fetch.
     */
    orderBy?: CoordinatorProfileOrderByWithRelationInput | CoordinatorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CoordinatorProfiles.
     */
    cursor?: CoordinatorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CoordinatorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CoordinatorProfiles.
     */
    skip?: number
    distinct?: CoordinatorProfileScalarFieldEnum | CoordinatorProfileScalarFieldEnum[]
  }

  /**
   * CoordinatorProfile create
   */
  export type CoordinatorProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a CoordinatorProfile.
     */
    data: XOR<CoordinatorProfileCreateInput, CoordinatorProfileUncheckedCreateInput>
  }

  /**
   * CoordinatorProfile createMany
   */
  export type CoordinatorProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CoordinatorProfiles.
     */
    data: CoordinatorProfileCreateManyInput | CoordinatorProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CoordinatorProfile createManyAndReturn
   */
  export type CoordinatorProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * The data used to create many CoordinatorProfiles.
     */
    data: CoordinatorProfileCreateManyInput | CoordinatorProfileCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CoordinatorProfile update
   */
  export type CoordinatorProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a CoordinatorProfile.
     */
    data: XOR<CoordinatorProfileUpdateInput, CoordinatorProfileUncheckedUpdateInput>
    /**
     * Choose, which CoordinatorProfile to update.
     */
    where: CoordinatorProfileWhereUniqueInput
  }

  /**
   * CoordinatorProfile updateMany
   */
  export type CoordinatorProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CoordinatorProfiles.
     */
    data: XOR<CoordinatorProfileUpdateManyMutationInput, CoordinatorProfileUncheckedUpdateManyInput>
    /**
     * Filter which CoordinatorProfiles to update
     */
    where?: CoordinatorProfileWhereInput
    /**
     * Limit how many CoordinatorProfiles to update.
     */
    limit?: number
  }

  /**
   * CoordinatorProfile updateManyAndReturn
   */
  export type CoordinatorProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * The data used to update CoordinatorProfiles.
     */
    data: XOR<CoordinatorProfileUpdateManyMutationInput, CoordinatorProfileUncheckedUpdateManyInput>
    /**
     * Filter which CoordinatorProfiles to update
     */
    where?: CoordinatorProfileWhereInput
    /**
     * Limit how many CoordinatorProfiles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CoordinatorProfile upsert
   */
  export type CoordinatorProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the CoordinatorProfile to update in case it exists.
     */
    where: CoordinatorProfileWhereUniqueInput
    /**
     * In case the CoordinatorProfile found by the `where` argument doesn't exist, create a new CoordinatorProfile with this data.
     */
    create: XOR<CoordinatorProfileCreateInput, CoordinatorProfileUncheckedCreateInput>
    /**
     * In case the CoordinatorProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CoordinatorProfileUpdateInput, CoordinatorProfileUncheckedUpdateInput>
  }

  /**
   * CoordinatorProfile delete
   */
  export type CoordinatorProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
    /**
     * Filter which CoordinatorProfile to delete.
     */
    where: CoordinatorProfileWhereUniqueInput
  }

  /**
   * CoordinatorProfile deleteMany
   */
  export type CoordinatorProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CoordinatorProfiles to delete
     */
    where?: CoordinatorProfileWhereInput
    /**
     * Limit how many CoordinatorProfiles to delete.
     */
    limit?: number
  }

  /**
   * CoordinatorProfile without action
   */
  export type CoordinatorProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoordinatorProfile
     */
    select?: CoordinatorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CoordinatorProfile
     */
    omit?: CoordinatorProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoordinatorProfileInclude<ExtArgs> | null
  }


  /**
   * Model AuditLog
   */

  export type AggregateAuditLog = {
    _count: AuditLogCountAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  export type AuditLogMinAggregateOutputType = {
    id: string | null
    userId: string | null
    action: $Enums.AuditAction | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date | null
  }

  export type AuditLogMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    action: $Enums.AuditAction | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date | null
  }

  export type AuditLogCountAggregateOutputType = {
    id: number
    userId: number
    action: number
    ipAddress: number
    userAgent: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type AuditLogMinAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    ipAddress?: true
    userAgent?: true
    createdAt?: true
  }

  export type AuditLogMaxAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    ipAddress?: true
    userAgent?: true
    createdAt?: true
  }

  export type AuditLogCountAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    ipAddress?: true
    userAgent?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type AuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLog to aggregate.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditLogs
    **/
    _count?: true | AuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditLogMaxAggregateInputType
  }

  export type GetAuditLogAggregateType<T extends AuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditLog[P]>
      : GetScalarType<T[P], AggregateAuditLog[P]>
  }




  export type AuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithAggregationInput | AuditLogOrderByWithAggregationInput[]
    by: AuditLogScalarFieldEnum[] | AuditLogScalarFieldEnum
    having?: AuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditLogCountAggregateInputType | true
    _min?: AuditLogMinAggregateInputType
    _max?: AuditLogMaxAggregateInputType
  }

  export type AuditLogGroupByOutputType = {
    id: string
    userId: string | null
    action: $Enums.AuditAction
    ipAddress: string | null
    userAgent: string | null
    metadata: JsonValue | null
    createdAt: Date
    _count: AuditLogCountAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  type GetAuditLogGroupByPayload<T extends AuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
        }
      >
    >


  export type AuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    metadata?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    metadata?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    metadata?: boolean
    createdAt?: boolean
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectScalar = {
    id?: boolean
    userId?: boolean
    action?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type AuditLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "action" | "ipAddress" | "userAgent" | "metadata" | "createdAt", ExtArgs["result"]["auditLog"]>
  export type AuditLogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }
  export type AuditLogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }
  export type AuditLogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | AuditLog$userArgs<ExtArgs>
  }

  export type $AuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditLog"
    objects: {
      user: Prisma.$UserPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string | null
      action: $Enums.AuditAction
      ipAddress: string | null
      userAgent: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["auditLog"]>
    composites: {}
  }

  type AuditLogGetPayload<S extends boolean | null | undefined | AuditLogDefaultArgs> = $Result.GetResult<Prisma.$AuditLogPayload, S>

  type AuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditLogCountAggregateInputType | true
    }

  export interface AuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditLog'], meta: { name: 'AuditLog' } }
    /**
     * Find zero or one AuditLog that matches the filter.
     * @param {AuditLogFindUniqueArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditLogFindUniqueArgs>(args: SelectSubset<T, AuditLogFindUniqueArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditLogFindUniqueOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditLogFindFirstArgs>(args?: SelectSubset<T, AuditLogFindFirstArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditLogs
     * const auditLogs = await prisma.auditLog.findMany()
     * 
     * // Get first 10 AuditLogs
     * const auditLogs = await prisma.auditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditLogFindManyArgs>(args?: SelectSubset<T, AuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditLog.
     * @param {AuditLogCreateArgs} args - Arguments to create a AuditLog.
     * @example
     * // Create one AuditLog
     * const AuditLog = await prisma.auditLog.create({
     *   data: {
     *     // ... data to create a AuditLog
     *   }
     * })
     * 
     */
    create<T extends AuditLogCreateArgs>(args: SelectSubset<T, AuditLogCreateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditLogs.
     * @param {AuditLogCreateManyArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditLogCreateManyArgs>(args?: SelectSubset<T, AuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditLogs and returns the data saved in the database.
     * @param {AuditLogCreateManyAndReturnArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditLog.
     * @param {AuditLogDeleteArgs} args - Arguments to delete one AuditLog.
     * @example
     * // Delete one AuditLog
     * const AuditLog = await prisma.auditLog.delete({
     *   where: {
     *     // ... filter to delete one AuditLog
     *   }
     * })
     * 
     */
    delete<T extends AuditLogDeleteArgs>(args: SelectSubset<T, AuditLogDeleteArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditLog.
     * @param {AuditLogUpdateArgs} args - Arguments to update one AuditLog.
     * @example
     * // Update one AuditLog
     * const auditLog = await prisma.auditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditLogUpdateArgs>(args: SelectSubset<T, AuditLogUpdateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditLogs.
     * @param {AuditLogDeleteManyArgs} args - Arguments to filter AuditLogs to delete.
     * @example
     * // Delete a few AuditLogs
     * const { count } = await prisma.auditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditLogDeleteManyArgs>(args?: SelectSubset<T, AuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditLogUpdateManyArgs>(args: SelectSubset<T, AuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs and returns the data updated in the database.
     * @param {AuditLogUpdateManyAndReturnArgs} args - Arguments to update many AuditLogs.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditLog.
     * @param {AuditLogUpsertArgs} args - Arguments to update or create a AuditLog.
     * @example
     * // Update or create a AuditLog
     * const auditLog = await prisma.auditLog.upsert({
     *   create: {
     *     // ... data to create a AuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditLog we want to update
     *   }
     * })
     */
    upsert<T extends AuditLogUpsertArgs>(args: SelectSubset<T, AuditLogUpsertArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogCountArgs} args - Arguments to filter AuditLogs to count.
     * @example
     * // Count the number of AuditLogs
     * const count = await prisma.auditLog.count({
     *   where: {
     *     // ... the filter for the AuditLogs we want to count
     *   }
     * })
    **/
    count<T extends AuditLogCountArgs>(
      args?: Subset<T, AuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditLogAggregateArgs>(args: Subset<T, AuditLogAggregateArgs>): Prisma.PrismaPromise<GetAuditLogAggregateType<T>>

    /**
     * Group by AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditLogGroupByArgs['orderBy'] }
        : { orderBy?: AuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditLog model
   */
  readonly fields: AuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends AuditLog$userArgs<ExtArgs> = {}>(args?: Subset<T, AuditLog$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditLog model
   */
  interface AuditLogFieldRefs {
    readonly id: FieldRef<"AuditLog", 'String'>
    readonly userId: FieldRef<"AuditLog", 'String'>
    readonly action: FieldRef<"AuditLog", 'AuditAction'>
    readonly ipAddress: FieldRef<"AuditLog", 'String'>
    readonly userAgent: FieldRef<"AuditLog", 'String'>
    readonly metadata: FieldRef<"AuditLog", 'Json'>
    readonly createdAt: FieldRef<"AuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AuditLog findUnique
   */
  export type AuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findUniqueOrThrow
   */
  export type AuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog findFirst
   */
  export type AuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findFirstOrThrow
   */
  export type AuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog findMany
   */
  export type AuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter, which AuditLogs to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
  }

  /**
   * AuditLog create
   */
  export type AuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The data needed to create a AuditLog.
     */
    data: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
  }

  /**
   * AuditLog createMany
   */
  export type AuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditLog createManyAndReturn
   */
  export type AuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AuditLog update
   */
  export type AuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The data needed to update a AuditLog.
     */
    data: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
    /**
     * Choose, which AuditLog to update.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog updateMany
   */
  export type AuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog updateManyAndReturn
   */
  export type AuditLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AuditLog upsert
   */
  export type AuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * The filter to search for the AuditLog to update in case it exists.
     */
    where: AuditLogWhereUniqueInput
    /**
     * In case the AuditLog found by the `where` argument doesn't exist, create a new AuditLog with this data.
     */
    create: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
    /**
     * In case the AuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
  }

  /**
   * AuditLog delete
   */
  export type AuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
    /**
     * Filter which AuditLog to delete.
     */
    where: AuditLogWhereUniqueInput
  }

  /**
   * AuditLog deleteMany
   */
  export type AuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLogs to delete
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to delete.
     */
    limit?: number
  }

  /**
   * AuditLog.user
   */
  export type AuditLog$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * AuditLog without action
   */
  export type AuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AuditLogInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    role: 'role',
    status: 'status',
    resetPasswordToken: 'resetPasswordToken',
    resetPasswordExpires: 'resetPasswordExpires',
    failedLoginAttempts: 'failedLoginAttempts',
    accountLockedUntil: 'accountLockedUntil',
    lastLoginAt: 'lastLoginAt',
    lastLoginIp: 'lastLoginIp',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const AccountScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    provider: 'provider',
    providerAccountId: 'providerAccountId',
    refresh_token: 'refresh_token',
    access_token: 'access_token',
    expires_at: 'expires_at',
    token_type: 'token_type',
    scope: 'scope',
    id_token: 'id_token',
    session_state: 'session_state'
  };

  export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    sessionToken: 'sessionToken',
    userId: 'userId',
    expires: 'expires'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const VerificationTokenScalarFieldEnum: {
    identifier: 'identifier',
    token: 'token',
    expires: 'expires'
  };

  export type VerificationTokenScalarFieldEnum = (typeof VerificationTokenScalarFieldEnum)[keyof typeof VerificationTokenScalarFieldEnum]


  export const WorkerProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    firstName: 'firstName',
    middleName: 'middleName',
    lastName: 'lastName',
    mobile: 'mobile',
    location: 'location',
    latitude: 'latitude',
    longitude: 'longitude',
    city: 'city',
    state: 'state',
    postalCode: 'postalCode',
    age: 'age',
    gender: 'gender',
    genderIdentity: 'genderIdentity',
    languages: 'languages',
    services: 'services',
    supportWorkerCategories: 'supportWorkerCategories',
    experience: 'experience',
    introduction: 'introduction',
    qualifications: 'qualifications',
    hasVehicle: 'hasVehicle',
    funFact: 'funFact',
    hobbies: 'hobbies',
    uniqueService: 'uniqueService',
    whyEnjoyWork: 'whyEnjoyWork',
    additionalInfo: 'additionalInfo',
    photos: 'photos',
    consentProfileShare: 'consentProfileShare',
    consentMarketing: 'consentMarketing',
    profileCompleted: 'profileCompleted',
    isPublished: 'isPublished',
    verificationStatus: 'verificationStatus',
    verificationChecklist: 'verificationChecklist',
    submittedDocuments: 'submittedDocuments',
    verificationSubmittedAt: 'verificationSubmittedAt',
    verificationReviewedAt: 'verificationReviewedAt',
    verificationApprovedAt: 'verificationApprovedAt',
    verificationRejectedAt: 'verificationRejectedAt',
    verificationNotes: 'verificationNotes',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WorkerProfileScalarFieldEnum = (typeof WorkerProfileScalarFieldEnum)[keyof typeof WorkerProfileScalarFieldEnum]


  export const VerificationRequirementScalarFieldEnum: {
    id: 'id',
    workerProfileId: 'workerProfileId',
    requirementType: 'requirementType',
    requirementName: 'requirementName',
    documentCategory: 'documentCategory',
    isRequired: 'isRequired',
    status: 'status',
    documentUrl: 'documentUrl',
    documentUploadedAt: 'documentUploadedAt',
    submittedAt: 'submittedAt',
    reviewedAt: 'reviewedAt',
    reviewedBy: 'reviewedBy',
    approvedAt: 'approvedAt',
    rejectedAt: 'rejectedAt',
    expiresAt: 'expiresAt',
    notes: 'notes',
    rejectionReason: 'rejectionReason',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type VerificationRequirementScalarFieldEnum = (typeof VerificationRequirementScalarFieldEnum)[keyof typeof VerificationRequirementScalarFieldEnum]


  export const ClientProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    firstName: 'firstName',
    lastName: 'lastName',
    mobile: 'mobile',
    location: 'location',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ClientProfileScalarFieldEnum = (typeof ClientProfileScalarFieldEnum)[keyof typeof ClientProfileScalarFieldEnum]


  export const CoordinatorProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    firstName: 'firstName',
    lastName: 'lastName',
    mobile: 'mobile',
    organization: 'organization',
    location: 'location',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CoordinatorProfileScalarFieldEnum = (typeof CoordinatorProfileScalarFieldEnum)[keyof typeof CoordinatorProfileScalarFieldEnum]


  export const AuditLogScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    action: 'action',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'AccountStatus'
   */
  export type EnumAccountStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountStatus'>
    


  /**
   * Reference to a field of type 'AccountStatus[]'
   */
  export type ListEnumAccountStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountStatus[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'VerificationStatus'
   */
  export type EnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus'>
    


  /**
   * Reference to a field of type 'VerificationStatus[]'
   */
  export type ListEnumVerificationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationStatus[]'>
    


  /**
   * Reference to a field of type 'DocumentCategory'
   */
  export type EnumDocumentCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentCategory'>
    


  /**
   * Reference to a field of type 'DocumentCategory[]'
   */
  export type ListEnumDocumentCategoryFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DocumentCategory[]'>
    


  /**
   * Reference to a field of type 'RequirementStatus'
   */
  export type EnumRequirementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RequirementStatus'>
    


  /**
   * Reference to a field of type 'RequirementStatus[]'
   */
  export type ListEnumRequirementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RequirementStatus[]'>
    


  /**
   * Reference to a field of type 'AuditAction'
   */
  export type EnumAuditActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuditAction'>
    


  /**
   * Reference to a field of type 'AuditAction[]'
   */
  export type ListEnumAuditActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuditAction[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    status?: EnumAccountStatusFilter<"User"> | $Enums.AccountStatus
    resetPasswordToken?: StringNullableFilter<"User"> | string | null
    resetPasswordExpires?: DateTimeNullableFilter<"User"> | Date | string | null
    failedLoginAttempts?: IntFilter<"User"> | number
    accountLockedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    lastLoginIp?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
    workerProfile?: XOR<WorkerProfileNullableScalarRelationFilter, WorkerProfileWhereInput> | null
    clientProfile?: XOR<ClientProfileNullableScalarRelationFilter, ClientProfileWhereInput> | null
    coordinatorProfile?: XOR<CoordinatorProfileNullableScalarRelationFilter, CoordinatorProfileWhereInput> | null
    auditLogs?: AuditLogListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    status?: SortOrder
    resetPasswordToken?: SortOrderInput | SortOrder
    resetPasswordExpires?: SortOrderInput | SortOrder
    failedLoginAttempts?: SortOrder
    accountLockedUntil?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    lastLoginIp?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    accounts?: AccountOrderByRelationAggregateInput
    sessions?: SessionOrderByRelationAggregateInput
    workerProfile?: WorkerProfileOrderByWithRelationInput
    clientProfile?: ClientProfileOrderByWithRelationInput
    coordinatorProfile?: CoordinatorProfileOrderByWithRelationInput
    auditLogs?: AuditLogOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    resetPasswordToken?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    passwordHash?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    status?: EnumAccountStatusFilter<"User"> | $Enums.AccountStatus
    resetPasswordExpires?: DateTimeNullableFilter<"User"> | Date | string | null
    failedLoginAttempts?: IntFilter<"User"> | number
    accountLockedUntil?: DateTimeNullableFilter<"User"> | Date | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    lastLoginIp?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
    workerProfile?: XOR<WorkerProfileNullableScalarRelationFilter, WorkerProfileWhereInput> | null
    clientProfile?: XOR<ClientProfileNullableScalarRelationFilter, ClientProfileWhereInput> | null
    coordinatorProfile?: XOR<CoordinatorProfileNullableScalarRelationFilter, CoordinatorProfileWhereInput> | null
    auditLogs?: AuditLogListRelationFilter
  }, "id" | "email" | "resetPasswordToken">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    status?: SortOrder
    resetPasswordToken?: SortOrderInput | SortOrder
    resetPasswordExpires?: SortOrderInput | SortOrder
    failedLoginAttempts?: SortOrder
    accountLockedUntil?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    lastLoginIp?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    status?: EnumAccountStatusWithAggregatesFilter<"User"> | $Enums.AccountStatus
    resetPasswordToken?: StringNullableWithAggregatesFilter<"User"> | string | null
    resetPasswordExpires?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    failedLoginAttempts?: IntWithAggregatesFilter<"User"> | number
    accountLockedUntil?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    lastLoginAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    lastLoginIp?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type AccountWhereInput = {
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    id?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    type?: StringFilter<"Account"> | string
    provider?: StringFilter<"Account"> | string
    providerAccountId?: StringFilter<"Account"> | string
    refresh_token?: StringNullableFilter<"Account"> | string | null
    access_token?: StringNullableFilter<"Account"> | string | null
    expires_at?: IntNullableFilter<"Account"> | number | null
    token_type?: StringNullableFilter<"Account"> | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    id_token?: StringNullableFilter<"Account"> | string | null
    session_state?: StringNullableFilter<"Account"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type AccountOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refresh_token?: SortOrderInput | SortOrder
    access_token?: SortOrderInput | SortOrder
    expires_at?: SortOrderInput | SortOrder
    token_type?: SortOrderInput | SortOrder
    scope?: SortOrderInput | SortOrder
    id_token?: SortOrderInput | SortOrder
    session_state?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type AccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider_providerAccountId?: AccountProviderProviderAccountIdCompoundUniqueInput
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    userId?: StringFilter<"Account"> | string
    type?: StringFilter<"Account"> | string
    provider?: StringFilter<"Account"> | string
    providerAccountId?: StringFilter<"Account"> | string
    refresh_token?: StringNullableFilter<"Account"> | string | null
    access_token?: StringNullableFilter<"Account"> | string | null
    expires_at?: IntNullableFilter<"Account"> | number | null
    token_type?: StringNullableFilter<"Account"> | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    id_token?: StringNullableFilter<"Account"> | string | null
    session_state?: StringNullableFilter<"Account"> | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "provider_providerAccountId">

  export type AccountOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refresh_token?: SortOrderInput | SortOrder
    access_token?: SortOrderInput | SortOrder
    expires_at?: SortOrderInput | SortOrder
    token_type?: SortOrderInput | SortOrder
    scope?: SortOrderInput | SortOrder
    id_token?: SortOrderInput | SortOrder
    session_state?: SortOrderInput | SortOrder
    _count?: AccountCountOrderByAggregateInput
    _avg?: AccountAvgOrderByAggregateInput
    _max?: AccountMaxOrderByAggregateInput
    _min?: AccountMinOrderByAggregateInput
    _sum?: AccountSumOrderByAggregateInput
  }

  export type AccountScalarWhereWithAggregatesInput = {
    AND?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    OR?: AccountScalarWhereWithAggregatesInput[]
    NOT?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Account"> | string
    userId?: StringWithAggregatesFilter<"Account"> | string
    type?: StringWithAggregatesFilter<"Account"> | string
    provider?: StringWithAggregatesFilter<"Account"> | string
    providerAccountId?: StringWithAggregatesFilter<"Account"> | string
    refresh_token?: StringNullableWithAggregatesFilter<"Account"> | string | null
    access_token?: StringNullableWithAggregatesFilter<"Account"> | string | null
    expires_at?: IntNullableWithAggregatesFilter<"Account"> | number | null
    token_type?: StringNullableWithAggregatesFilter<"Account"> | string | null
    scope?: StringNullableWithAggregatesFilter<"Account"> | string | null
    id_token?: StringNullableWithAggregatesFilter<"Account"> | string | null
    session_state?: StringNullableWithAggregatesFilter<"Account"> | string | null
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    sessionToken?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sessionToken?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "sessionToken">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    sessionToken?: StringWithAggregatesFilter<"Session"> | string
    userId?: StringWithAggregatesFilter<"Session"> | string
    expires?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type VerificationTokenWhereInput = {
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    identifier?: StringFilter<"VerificationToken"> | string
    token?: StringFilter<"VerificationToken"> | string
    expires?: DateTimeFilter<"VerificationToken"> | Date | string
  }

  export type VerificationTokenOrderByWithRelationInput = {
    identifier?: SortOrder
    token?: SortOrder
    expires?: SortOrder
  }

  export type VerificationTokenWhereUniqueInput = Prisma.AtLeast<{
    token?: string
    identifier_token?: VerificationTokenIdentifierTokenCompoundUniqueInput
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    identifier?: StringFilter<"VerificationToken"> | string
    expires?: DateTimeFilter<"VerificationToken"> | Date | string
  }, "token" | "identifier_token">

  export type VerificationTokenOrderByWithAggregationInput = {
    identifier?: SortOrder
    token?: SortOrder
    expires?: SortOrder
    _count?: VerificationTokenCountOrderByAggregateInput
    _max?: VerificationTokenMaxOrderByAggregateInput
    _min?: VerificationTokenMinOrderByAggregateInput
  }

  export type VerificationTokenScalarWhereWithAggregatesInput = {
    AND?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    OR?: VerificationTokenScalarWhereWithAggregatesInput[]
    NOT?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    identifier?: StringWithAggregatesFilter<"VerificationToken"> | string
    token?: StringWithAggregatesFilter<"VerificationToken"> | string
    expires?: DateTimeWithAggregatesFilter<"VerificationToken"> | Date | string
  }

  export type WorkerProfileWhereInput = {
    AND?: WorkerProfileWhereInput | WorkerProfileWhereInput[]
    OR?: WorkerProfileWhereInput[]
    NOT?: WorkerProfileWhereInput | WorkerProfileWhereInput[]
    id?: StringFilter<"WorkerProfile"> | string
    userId?: StringFilter<"WorkerProfile"> | string
    firstName?: StringFilter<"WorkerProfile"> | string
    middleName?: StringNullableFilter<"WorkerProfile"> | string | null
    lastName?: StringFilter<"WorkerProfile"> | string
    mobile?: StringFilter<"WorkerProfile"> | string
    location?: StringFilter<"WorkerProfile"> | string
    latitude?: FloatNullableFilter<"WorkerProfile"> | number | null
    longitude?: FloatNullableFilter<"WorkerProfile"> | number | null
    city?: StringNullableFilter<"WorkerProfile"> | string | null
    state?: StringNullableFilter<"WorkerProfile"> | string | null
    postalCode?: StringNullableFilter<"WorkerProfile"> | string | null
    age?: StringFilter<"WorkerProfile"> | string
    gender?: StringFilter<"WorkerProfile"> | string
    genderIdentity?: StringFilter<"WorkerProfile"> | string
    languages?: StringNullableListFilter<"WorkerProfile">
    services?: StringNullableListFilter<"WorkerProfile">
    supportWorkerCategories?: StringNullableListFilter<"WorkerProfile">
    experience?: StringFilter<"WorkerProfile"> | string
    introduction?: StringFilter<"WorkerProfile"> | string
    qualifications?: StringFilter<"WorkerProfile"> | string
    hasVehicle?: StringFilter<"WorkerProfile"> | string
    funFact?: StringFilter<"WorkerProfile"> | string
    hobbies?: StringFilter<"WorkerProfile"> | string
    uniqueService?: StringFilter<"WorkerProfile"> | string
    whyEnjoyWork?: StringFilter<"WorkerProfile"> | string
    additionalInfo?: StringNullableFilter<"WorkerProfile"> | string | null
    photos?: JsonNullableFilter<"WorkerProfile">
    consentProfileShare?: BoolFilter<"WorkerProfile"> | boolean
    consentMarketing?: BoolFilter<"WorkerProfile"> | boolean
    profileCompleted?: BoolFilter<"WorkerProfile"> | boolean
    isPublished?: BoolFilter<"WorkerProfile"> | boolean
    verificationStatus?: EnumVerificationStatusFilter<"WorkerProfile"> | $Enums.VerificationStatus
    verificationChecklist?: JsonNullableFilter<"WorkerProfile">
    submittedDocuments?: JsonNullableFilter<"WorkerProfile">
    verificationSubmittedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationReviewedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationApprovedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationRejectedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationNotes?: StringNullableFilter<"WorkerProfile"> | string | null
    createdAt?: DateTimeFilter<"WorkerProfile"> | Date | string
    updatedAt?: DateTimeFilter<"WorkerProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    verificationRequirements?: VerificationRequirementListRelationFilter
  }

  export type WorkerProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    middleName?: SortOrderInput | SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    age?: SortOrder
    gender?: SortOrder
    genderIdentity?: SortOrder
    languages?: SortOrder
    services?: SortOrder
    supportWorkerCategories?: SortOrder
    experience?: SortOrder
    introduction?: SortOrder
    qualifications?: SortOrder
    hasVehicle?: SortOrder
    funFact?: SortOrder
    hobbies?: SortOrder
    uniqueService?: SortOrder
    whyEnjoyWork?: SortOrder
    additionalInfo?: SortOrderInput | SortOrder
    photos?: SortOrderInput | SortOrder
    consentProfileShare?: SortOrder
    consentMarketing?: SortOrder
    profileCompleted?: SortOrder
    isPublished?: SortOrder
    verificationStatus?: SortOrder
    verificationChecklist?: SortOrderInput | SortOrder
    submittedDocuments?: SortOrderInput | SortOrder
    verificationSubmittedAt?: SortOrderInput | SortOrder
    verificationReviewedAt?: SortOrderInput | SortOrder
    verificationApprovedAt?: SortOrderInput | SortOrder
    verificationRejectedAt?: SortOrderInput | SortOrder
    verificationNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    verificationRequirements?: VerificationRequirementOrderByRelationAggregateInput
  }

  export type WorkerProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: WorkerProfileWhereInput | WorkerProfileWhereInput[]
    OR?: WorkerProfileWhereInput[]
    NOT?: WorkerProfileWhereInput | WorkerProfileWhereInput[]
    firstName?: StringFilter<"WorkerProfile"> | string
    middleName?: StringNullableFilter<"WorkerProfile"> | string | null
    lastName?: StringFilter<"WorkerProfile"> | string
    mobile?: StringFilter<"WorkerProfile"> | string
    location?: StringFilter<"WorkerProfile"> | string
    latitude?: FloatNullableFilter<"WorkerProfile"> | number | null
    longitude?: FloatNullableFilter<"WorkerProfile"> | number | null
    city?: StringNullableFilter<"WorkerProfile"> | string | null
    state?: StringNullableFilter<"WorkerProfile"> | string | null
    postalCode?: StringNullableFilter<"WorkerProfile"> | string | null
    age?: StringFilter<"WorkerProfile"> | string
    gender?: StringFilter<"WorkerProfile"> | string
    genderIdentity?: StringFilter<"WorkerProfile"> | string
    languages?: StringNullableListFilter<"WorkerProfile">
    services?: StringNullableListFilter<"WorkerProfile">
    supportWorkerCategories?: StringNullableListFilter<"WorkerProfile">
    experience?: StringFilter<"WorkerProfile"> | string
    introduction?: StringFilter<"WorkerProfile"> | string
    qualifications?: StringFilter<"WorkerProfile"> | string
    hasVehicle?: StringFilter<"WorkerProfile"> | string
    funFact?: StringFilter<"WorkerProfile"> | string
    hobbies?: StringFilter<"WorkerProfile"> | string
    uniqueService?: StringFilter<"WorkerProfile"> | string
    whyEnjoyWork?: StringFilter<"WorkerProfile"> | string
    additionalInfo?: StringNullableFilter<"WorkerProfile"> | string | null
    photos?: JsonNullableFilter<"WorkerProfile">
    consentProfileShare?: BoolFilter<"WorkerProfile"> | boolean
    consentMarketing?: BoolFilter<"WorkerProfile"> | boolean
    profileCompleted?: BoolFilter<"WorkerProfile"> | boolean
    isPublished?: BoolFilter<"WorkerProfile"> | boolean
    verificationStatus?: EnumVerificationStatusFilter<"WorkerProfile"> | $Enums.VerificationStatus
    verificationChecklist?: JsonNullableFilter<"WorkerProfile">
    submittedDocuments?: JsonNullableFilter<"WorkerProfile">
    verificationSubmittedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationReviewedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationApprovedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationRejectedAt?: DateTimeNullableFilter<"WorkerProfile"> | Date | string | null
    verificationNotes?: StringNullableFilter<"WorkerProfile"> | string | null
    createdAt?: DateTimeFilter<"WorkerProfile"> | Date | string
    updatedAt?: DateTimeFilter<"WorkerProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    verificationRequirements?: VerificationRequirementListRelationFilter
  }, "id" | "userId">

  export type WorkerProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    middleName?: SortOrderInput | SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    age?: SortOrder
    gender?: SortOrder
    genderIdentity?: SortOrder
    languages?: SortOrder
    services?: SortOrder
    supportWorkerCategories?: SortOrder
    experience?: SortOrder
    introduction?: SortOrder
    qualifications?: SortOrder
    hasVehicle?: SortOrder
    funFact?: SortOrder
    hobbies?: SortOrder
    uniqueService?: SortOrder
    whyEnjoyWork?: SortOrder
    additionalInfo?: SortOrderInput | SortOrder
    photos?: SortOrderInput | SortOrder
    consentProfileShare?: SortOrder
    consentMarketing?: SortOrder
    profileCompleted?: SortOrder
    isPublished?: SortOrder
    verificationStatus?: SortOrder
    verificationChecklist?: SortOrderInput | SortOrder
    submittedDocuments?: SortOrderInput | SortOrder
    verificationSubmittedAt?: SortOrderInput | SortOrder
    verificationReviewedAt?: SortOrderInput | SortOrder
    verificationApprovedAt?: SortOrderInput | SortOrder
    verificationRejectedAt?: SortOrderInput | SortOrder
    verificationNotes?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WorkerProfileCountOrderByAggregateInput
    _avg?: WorkerProfileAvgOrderByAggregateInput
    _max?: WorkerProfileMaxOrderByAggregateInput
    _min?: WorkerProfileMinOrderByAggregateInput
    _sum?: WorkerProfileSumOrderByAggregateInput
  }

  export type WorkerProfileScalarWhereWithAggregatesInput = {
    AND?: WorkerProfileScalarWhereWithAggregatesInput | WorkerProfileScalarWhereWithAggregatesInput[]
    OR?: WorkerProfileScalarWhereWithAggregatesInput[]
    NOT?: WorkerProfileScalarWhereWithAggregatesInput | WorkerProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WorkerProfile"> | string
    userId?: StringWithAggregatesFilter<"WorkerProfile"> | string
    firstName?: StringWithAggregatesFilter<"WorkerProfile"> | string
    middleName?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    lastName?: StringWithAggregatesFilter<"WorkerProfile"> | string
    mobile?: StringWithAggregatesFilter<"WorkerProfile"> | string
    location?: StringWithAggregatesFilter<"WorkerProfile"> | string
    latitude?: FloatNullableWithAggregatesFilter<"WorkerProfile"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"WorkerProfile"> | number | null
    city?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    state?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    postalCode?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    age?: StringWithAggregatesFilter<"WorkerProfile"> | string
    gender?: StringWithAggregatesFilter<"WorkerProfile"> | string
    genderIdentity?: StringWithAggregatesFilter<"WorkerProfile"> | string
    languages?: StringNullableListFilter<"WorkerProfile">
    services?: StringNullableListFilter<"WorkerProfile">
    supportWorkerCategories?: StringNullableListFilter<"WorkerProfile">
    experience?: StringWithAggregatesFilter<"WorkerProfile"> | string
    introduction?: StringWithAggregatesFilter<"WorkerProfile"> | string
    qualifications?: StringWithAggregatesFilter<"WorkerProfile"> | string
    hasVehicle?: StringWithAggregatesFilter<"WorkerProfile"> | string
    funFact?: StringWithAggregatesFilter<"WorkerProfile"> | string
    hobbies?: StringWithAggregatesFilter<"WorkerProfile"> | string
    uniqueService?: StringWithAggregatesFilter<"WorkerProfile"> | string
    whyEnjoyWork?: StringWithAggregatesFilter<"WorkerProfile"> | string
    additionalInfo?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    photos?: JsonNullableWithAggregatesFilter<"WorkerProfile">
    consentProfileShare?: BoolWithAggregatesFilter<"WorkerProfile"> | boolean
    consentMarketing?: BoolWithAggregatesFilter<"WorkerProfile"> | boolean
    profileCompleted?: BoolWithAggregatesFilter<"WorkerProfile"> | boolean
    isPublished?: BoolWithAggregatesFilter<"WorkerProfile"> | boolean
    verificationStatus?: EnumVerificationStatusWithAggregatesFilter<"WorkerProfile"> | $Enums.VerificationStatus
    verificationChecklist?: JsonNullableWithAggregatesFilter<"WorkerProfile">
    submittedDocuments?: JsonNullableWithAggregatesFilter<"WorkerProfile">
    verificationSubmittedAt?: DateTimeNullableWithAggregatesFilter<"WorkerProfile"> | Date | string | null
    verificationReviewedAt?: DateTimeNullableWithAggregatesFilter<"WorkerProfile"> | Date | string | null
    verificationApprovedAt?: DateTimeNullableWithAggregatesFilter<"WorkerProfile"> | Date | string | null
    verificationRejectedAt?: DateTimeNullableWithAggregatesFilter<"WorkerProfile"> | Date | string | null
    verificationNotes?: StringNullableWithAggregatesFilter<"WorkerProfile"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"WorkerProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WorkerProfile"> | Date | string
  }

  export type VerificationRequirementWhereInput = {
    AND?: VerificationRequirementWhereInput | VerificationRequirementWhereInput[]
    OR?: VerificationRequirementWhereInput[]
    NOT?: VerificationRequirementWhereInput | VerificationRequirementWhereInput[]
    id?: StringFilter<"VerificationRequirement"> | string
    workerProfileId?: StringFilter<"VerificationRequirement"> | string
    requirementType?: StringFilter<"VerificationRequirement"> | string
    requirementName?: StringFilter<"VerificationRequirement"> | string
    documentCategory?: EnumDocumentCategoryNullableFilter<"VerificationRequirement"> | $Enums.DocumentCategory | null
    isRequired?: BoolFilter<"VerificationRequirement"> | boolean
    status?: EnumRequirementStatusFilter<"VerificationRequirement"> | $Enums.RequirementStatus
    documentUrl?: StringNullableFilter<"VerificationRequirement"> | string | null
    documentUploadedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    submittedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedBy?: StringNullableFilter<"VerificationRequirement"> | string | null
    approvedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    rejectedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    notes?: StringNullableFilter<"VerificationRequirement"> | string | null
    rejectionReason?: StringNullableFilter<"VerificationRequirement"> | string | null
    createdAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
    updatedAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
    workerProfile?: XOR<WorkerProfileScalarRelationFilter, WorkerProfileWhereInput>
  }

  export type VerificationRequirementOrderByWithRelationInput = {
    id?: SortOrder
    workerProfileId?: SortOrder
    requirementType?: SortOrder
    requirementName?: SortOrder
    documentCategory?: SortOrderInput | SortOrder
    isRequired?: SortOrder
    status?: SortOrder
    documentUrl?: SortOrderInput | SortOrder
    documentUploadedAt?: SortOrderInput | SortOrder
    submittedAt?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    reviewedBy?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    rejectedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    rejectionReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    workerProfile?: WorkerProfileOrderByWithRelationInput
  }

  export type VerificationRequirementWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VerificationRequirementWhereInput | VerificationRequirementWhereInput[]
    OR?: VerificationRequirementWhereInput[]
    NOT?: VerificationRequirementWhereInput | VerificationRequirementWhereInput[]
    workerProfileId?: StringFilter<"VerificationRequirement"> | string
    requirementType?: StringFilter<"VerificationRequirement"> | string
    requirementName?: StringFilter<"VerificationRequirement"> | string
    documentCategory?: EnumDocumentCategoryNullableFilter<"VerificationRequirement"> | $Enums.DocumentCategory | null
    isRequired?: BoolFilter<"VerificationRequirement"> | boolean
    status?: EnumRequirementStatusFilter<"VerificationRequirement"> | $Enums.RequirementStatus
    documentUrl?: StringNullableFilter<"VerificationRequirement"> | string | null
    documentUploadedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    submittedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedBy?: StringNullableFilter<"VerificationRequirement"> | string | null
    approvedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    rejectedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    notes?: StringNullableFilter<"VerificationRequirement"> | string | null
    rejectionReason?: StringNullableFilter<"VerificationRequirement"> | string | null
    createdAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
    updatedAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
    workerProfile?: XOR<WorkerProfileScalarRelationFilter, WorkerProfileWhereInput>
  }, "id">

  export type VerificationRequirementOrderByWithAggregationInput = {
    id?: SortOrder
    workerProfileId?: SortOrder
    requirementType?: SortOrder
    requirementName?: SortOrder
    documentCategory?: SortOrderInput | SortOrder
    isRequired?: SortOrder
    status?: SortOrder
    documentUrl?: SortOrderInput | SortOrder
    documentUploadedAt?: SortOrderInput | SortOrder
    submittedAt?: SortOrderInput | SortOrder
    reviewedAt?: SortOrderInput | SortOrder
    reviewedBy?: SortOrderInput | SortOrder
    approvedAt?: SortOrderInput | SortOrder
    rejectedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    rejectionReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: VerificationRequirementCountOrderByAggregateInput
    _max?: VerificationRequirementMaxOrderByAggregateInput
    _min?: VerificationRequirementMinOrderByAggregateInput
  }

  export type VerificationRequirementScalarWhereWithAggregatesInput = {
    AND?: VerificationRequirementScalarWhereWithAggregatesInput | VerificationRequirementScalarWhereWithAggregatesInput[]
    OR?: VerificationRequirementScalarWhereWithAggregatesInput[]
    NOT?: VerificationRequirementScalarWhereWithAggregatesInput | VerificationRequirementScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationRequirement"> | string
    workerProfileId?: StringWithAggregatesFilter<"VerificationRequirement"> | string
    requirementType?: StringWithAggregatesFilter<"VerificationRequirement"> | string
    requirementName?: StringWithAggregatesFilter<"VerificationRequirement"> | string
    documentCategory?: EnumDocumentCategoryNullableWithAggregatesFilter<"VerificationRequirement"> | $Enums.DocumentCategory | null
    isRequired?: BoolWithAggregatesFilter<"VerificationRequirement"> | boolean
    status?: EnumRequirementStatusWithAggregatesFilter<"VerificationRequirement"> | $Enums.RequirementStatus
    documentUrl?: StringNullableWithAggregatesFilter<"VerificationRequirement"> | string | null
    documentUploadedAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    submittedAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    reviewedAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    reviewedBy?: StringNullableWithAggregatesFilter<"VerificationRequirement"> | string | null
    approvedAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    rejectedAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    expiresAt?: DateTimeNullableWithAggregatesFilter<"VerificationRequirement"> | Date | string | null
    notes?: StringNullableWithAggregatesFilter<"VerificationRequirement"> | string | null
    rejectionReason?: StringNullableWithAggregatesFilter<"VerificationRequirement"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"VerificationRequirement"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"VerificationRequirement"> | Date | string
  }

  export type ClientProfileWhereInput = {
    AND?: ClientProfileWhereInput | ClientProfileWhereInput[]
    OR?: ClientProfileWhereInput[]
    NOT?: ClientProfileWhereInput | ClientProfileWhereInput[]
    id?: StringFilter<"ClientProfile"> | string
    userId?: StringFilter<"ClientProfile"> | string
    firstName?: StringFilter<"ClientProfile"> | string
    lastName?: StringFilter<"ClientProfile"> | string
    mobile?: StringFilter<"ClientProfile"> | string
    location?: StringNullableFilter<"ClientProfile"> | string | null
    createdAt?: DateTimeFilter<"ClientProfile"> | Date | string
    updatedAt?: DateTimeFilter<"ClientProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type ClientProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type ClientProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: ClientProfileWhereInput | ClientProfileWhereInput[]
    OR?: ClientProfileWhereInput[]
    NOT?: ClientProfileWhereInput | ClientProfileWhereInput[]
    firstName?: StringFilter<"ClientProfile"> | string
    lastName?: StringFilter<"ClientProfile"> | string
    mobile?: StringFilter<"ClientProfile"> | string
    location?: StringNullableFilter<"ClientProfile"> | string | null
    createdAt?: DateTimeFilter<"ClientProfile"> | Date | string
    updatedAt?: DateTimeFilter<"ClientProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type ClientProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ClientProfileCountOrderByAggregateInput
    _max?: ClientProfileMaxOrderByAggregateInput
    _min?: ClientProfileMinOrderByAggregateInput
  }

  export type ClientProfileScalarWhereWithAggregatesInput = {
    AND?: ClientProfileScalarWhereWithAggregatesInput | ClientProfileScalarWhereWithAggregatesInput[]
    OR?: ClientProfileScalarWhereWithAggregatesInput[]
    NOT?: ClientProfileScalarWhereWithAggregatesInput | ClientProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ClientProfile"> | string
    userId?: StringWithAggregatesFilter<"ClientProfile"> | string
    firstName?: StringWithAggregatesFilter<"ClientProfile"> | string
    lastName?: StringWithAggregatesFilter<"ClientProfile"> | string
    mobile?: StringWithAggregatesFilter<"ClientProfile"> | string
    location?: StringNullableWithAggregatesFilter<"ClientProfile"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ClientProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ClientProfile"> | Date | string
  }

  export type CoordinatorProfileWhereInput = {
    AND?: CoordinatorProfileWhereInput | CoordinatorProfileWhereInput[]
    OR?: CoordinatorProfileWhereInput[]
    NOT?: CoordinatorProfileWhereInput | CoordinatorProfileWhereInput[]
    id?: StringFilter<"CoordinatorProfile"> | string
    userId?: StringFilter<"CoordinatorProfile"> | string
    firstName?: StringFilter<"CoordinatorProfile"> | string
    lastName?: StringFilter<"CoordinatorProfile"> | string
    mobile?: StringFilter<"CoordinatorProfile"> | string
    organization?: StringNullableFilter<"CoordinatorProfile"> | string | null
    location?: StringNullableFilter<"CoordinatorProfile"> | string | null
    createdAt?: DateTimeFilter<"CoordinatorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"CoordinatorProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CoordinatorProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    organization?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type CoordinatorProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: CoordinatorProfileWhereInput | CoordinatorProfileWhereInput[]
    OR?: CoordinatorProfileWhereInput[]
    NOT?: CoordinatorProfileWhereInput | CoordinatorProfileWhereInput[]
    firstName?: StringFilter<"CoordinatorProfile"> | string
    lastName?: StringFilter<"CoordinatorProfile"> | string
    mobile?: StringFilter<"CoordinatorProfile"> | string
    organization?: StringNullableFilter<"CoordinatorProfile"> | string | null
    location?: StringNullableFilter<"CoordinatorProfile"> | string | null
    createdAt?: DateTimeFilter<"CoordinatorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"CoordinatorProfile"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type CoordinatorProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    organization?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CoordinatorProfileCountOrderByAggregateInput
    _max?: CoordinatorProfileMaxOrderByAggregateInput
    _min?: CoordinatorProfileMinOrderByAggregateInput
  }

  export type CoordinatorProfileScalarWhereWithAggregatesInput = {
    AND?: CoordinatorProfileScalarWhereWithAggregatesInput | CoordinatorProfileScalarWhereWithAggregatesInput[]
    OR?: CoordinatorProfileScalarWhereWithAggregatesInput[]
    NOT?: CoordinatorProfileScalarWhereWithAggregatesInput | CoordinatorProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CoordinatorProfile"> | string
    userId?: StringWithAggregatesFilter<"CoordinatorProfile"> | string
    firstName?: StringWithAggregatesFilter<"CoordinatorProfile"> | string
    lastName?: StringWithAggregatesFilter<"CoordinatorProfile"> | string
    mobile?: StringWithAggregatesFilter<"CoordinatorProfile"> | string
    organization?: StringNullableWithAggregatesFilter<"CoordinatorProfile"> | string | null
    location?: StringNullableWithAggregatesFilter<"CoordinatorProfile"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CoordinatorProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CoordinatorProfile"> | Date | string
  }

  export type AuditLogWhereInput = {
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    id?: StringFilter<"AuditLog"> | string
    userId?: StringNullableFilter<"AuditLog"> | string | null
    action?: EnumAuditActionFilter<"AuditLog"> | $Enums.AuditAction
    ipAddress?: StringNullableFilter<"AuditLog"> | string | null
    userAgent?: StringNullableFilter<"AuditLog"> | string | null
    metadata?: JsonNullableFilter<"AuditLog">
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }

  export type AuditLogOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    action?: SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type AuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    userId?: StringNullableFilter<"AuditLog"> | string | null
    action?: EnumAuditActionFilter<"AuditLog"> | $Enums.AuditAction
    ipAddress?: StringNullableFilter<"AuditLog"> | string | null
    userAgent?: StringNullableFilter<"AuditLog"> | string | null
    metadata?: JsonNullableFilter<"AuditLog">
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
  }, "id">

  export type AuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    action?: SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: AuditLogCountOrderByAggregateInput
    _max?: AuditLogMaxOrderByAggregateInput
    _min?: AuditLogMinOrderByAggregateInput
  }

  export type AuditLogScalarWhereWithAggregatesInput = {
    AND?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    OR?: AuditLogScalarWhereWithAggregatesInput[]
    NOT?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AuditLog"> | string
    userId?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    action?: EnumAuditActionWithAggregatesFilter<"AuditLog"> | $Enums.AuditAction
    ipAddress?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"AuditLog">
    createdAt?: DateTimeWithAggregatesFilter<"AuditLog"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountCreateInput = {
    id?: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
    user: UserCreateNestedOneWithoutAccountsInput
  }

  export type AccountUncheckedCreateInput = {
    id?: string
    userId: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
  }

  export type AccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutAccountsNestedInput
  }

  export type AccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AccountCreateManyInput = {
    id?: string
    userId: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
  }

  export type AccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionCreateInput = {
    id?: string
    sessionToken: string
    expires: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id?: string
    sessionToken: string
    userId: string
    expires: Date | string
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    id?: string
    sessionToken: string
    userId: string
    expires: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateInput = {
    identifier: string
    token: string
    expires: Date | string
  }

  export type VerificationTokenUncheckedCreateInput = {
    identifier: string
    token: string
    expires: Date | string
  }

  export type VerificationTokenUpdateInput = {
    identifier?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateInput = {
    identifier?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateManyInput = {
    identifier: string
    token: string
    expires: Date | string
  }

  export type VerificationTokenUpdateManyMutationInput = {
    identifier?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateManyInput = {
    identifier?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkerProfileCreateInput = {
    id?: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutWorkerProfileInput
    verificationRequirements?: VerificationRequirementCreateNestedManyWithoutWorkerProfileInput
  }

  export type WorkerProfileUncheckedCreateInput = {
    id?: string
    userId: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    verificationRequirements?: VerificationRequirementUncheckedCreateNestedManyWithoutWorkerProfileInput
  }

  export type WorkerProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWorkerProfileNestedInput
    verificationRequirements?: VerificationRequirementUpdateManyWithoutWorkerProfileNestedInput
  }

  export type WorkerProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verificationRequirements?: VerificationRequirementUncheckedUpdateManyWithoutWorkerProfileNestedInput
  }

  export type WorkerProfileCreateManyInput = {
    id?: string
    userId: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkerProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WorkerProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementCreateInput = {
    id?: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    workerProfile: WorkerProfileCreateNestedOneWithoutVerificationRequirementsInput
  }

  export type VerificationRequirementUncheckedCreateInput = {
    id?: string
    workerProfileId: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationRequirementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    workerProfile?: WorkerProfileUpdateOneRequiredWithoutVerificationRequirementsNestedInput
  }

  export type VerificationRequirementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerProfileId?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementCreateManyInput = {
    id?: string
    workerProfileId: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationRequirementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerProfileId?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClientProfileCreateInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutClientProfileInput
  }

  export type ClientProfileUncheckedCreateInput = {
    id?: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClientProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutClientProfileNestedInput
  }

  export type ClientProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClientProfileCreateManyInput = {
    id?: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClientProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClientProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoordinatorProfileCreateInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    organization?: string | null
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutCoordinatorProfileInput
  }

  export type CoordinatorProfileUncheckedCreateInput = {
    id?: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    organization?: string | null
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoordinatorProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutCoordinatorProfileNestedInput
  }

  export type CoordinatorProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoordinatorProfileCreateManyInput = {
    id?: string
    userId: string
    firstName: string
    lastName: string
    mobile: string
    organization?: string | null
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoordinatorProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoordinatorProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateInput = {
    id?: string
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    user?: UserCreateNestedOneWithoutAuditLogsInput
  }

  export type AuditLogUncheckedCreateInput = {
    id?: string
    userId?: string | null
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneWithoutAuditLogsNestedInput
  }

  export type AuditLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateManyInput = {
    id?: string
    userId?: string | null
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type EnumAccountStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountStatus | EnumAccountStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountStatusFilter<$PrismaModel> | $Enums.AccountStatus
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type AccountListRelationFilter = {
    every?: AccountWhereInput
    some?: AccountWhereInput
    none?: AccountWhereInput
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

  export type WorkerProfileNullableScalarRelationFilter = {
    is?: WorkerProfileWhereInput | null
    isNot?: WorkerProfileWhereInput | null
  }

  export type ClientProfileNullableScalarRelationFilter = {
    is?: ClientProfileWhereInput | null
    isNot?: ClientProfileWhereInput | null
  }

  export type CoordinatorProfileNullableScalarRelationFilter = {
    is?: CoordinatorProfileWhereInput | null
    isNot?: CoordinatorProfileWhereInput | null
  }

  export type AuditLogListRelationFilter = {
    every?: AuditLogWhereInput
    some?: AuditLogWhereInput
    none?: AuditLogWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AccountOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AuditLogOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    status?: SortOrder
    resetPasswordToken?: SortOrder
    resetPasswordExpires?: SortOrder
    failedLoginAttempts?: SortOrder
    accountLockedUntil?: SortOrder
    lastLoginAt?: SortOrder
    lastLoginIp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    failedLoginAttempts?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    status?: SortOrder
    resetPasswordToken?: SortOrder
    resetPasswordExpires?: SortOrder
    failedLoginAttempts?: SortOrder
    accountLockedUntil?: SortOrder
    lastLoginAt?: SortOrder
    lastLoginIp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    role?: SortOrder
    status?: SortOrder
    resetPasswordToken?: SortOrder
    resetPasswordExpires?: SortOrder
    failedLoginAttempts?: SortOrder
    accountLockedUntil?: SortOrder
    lastLoginAt?: SortOrder
    lastLoginIp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    failedLoginAttempts?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type EnumAccountStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountStatus | EnumAccountStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountStatusWithAggregatesFilter<$PrismaModel> | $Enums.AccountStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountStatusFilter<$PrismaModel>
    _max?: NestedEnumAccountStatusFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type AccountProviderProviderAccountIdCompoundUniqueInput = {
    provider: string
    providerAccountId: string
  }

  export type AccountCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refresh_token?: SortOrder
    access_token?: SortOrder
    expires_at?: SortOrder
    token_type?: SortOrder
    scope?: SortOrder
    id_token?: SortOrder
    session_state?: SortOrder
  }

  export type AccountAvgOrderByAggregateInput = {
    expires_at?: SortOrder
  }

  export type AccountMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refresh_token?: SortOrder
    access_token?: SortOrder
    expires_at?: SortOrder
    token_type?: SortOrder
    scope?: SortOrder
    id_token?: SortOrder
    session_state?: SortOrder
  }

  export type AccountMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refresh_token?: SortOrder
    access_token?: SortOrder
    expires_at?: SortOrder
    token_type?: SortOrder
    scope?: SortOrder
    id_token?: SortOrder
    session_state?: SortOrder
  }

  export type AccountSumOrderByAggregateInput = {
    expires_at?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
  }

  export type VerificationTokenIdentifierTokenCompoundUniqueInput = {
    identifier: string
    token: string
  }

  export type VerificationTokenCountOrderByAggregateInput = {
    identifier?: SortOrder
    token?: SortOrder
    expires?: SortOrder
  }

  export type VerificationTokenMaxOrderByAggregateInput = {
    identifier?: SortOrder
    token?: SortOrder
    expires?: SortOrder
  }

  export type VerificationTokenMinOrderByAggregateInput = {
    identifier?: SortOrder
    token?: SortOrder
    expires?: SortOrder
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type EnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type VerificationRequirementListRelationFilter = {
    every?: VerificationRequirementWhereInput
    some?: VerificationRequirementWhereInput
    none?: VerificationRequirementWhereInput
  }

  export type VerificationRequirementOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type WorkerProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    middleName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalCode?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    genderIdentity?: SortOrder
    languages?: SortOrder
    services?: SortOrder
    supportWorkerCategories?: SortOrder
    experience?: SortOrder
    introduction?: SortOrder
    qualifications?: SortOrder
    hasVehicle?: SortOrder
    funFact?: SortOrder
    hobbies?: SortOrder
    uniqueService?: SortOrder
    whyEnjoyWork?: SortOrder
    additionalInfo?: SortOrder
    photos?: SortOrder
    consentProfileShare?: SortOrder
    consentMarketing?: SortOrder
    profileCompleted?: SortOrder
    isPublished?: SortOrder
    verificationStatus?: SortOrder
    verificationChecklist?: SortOrder
    submittedDocuments?: SortOrder
    verificationSubmittedAt?: SortOrder
    verificationReviewedAt?: SortOrder
    verificationApprovedAt?: SortOrder
    verificationRejectedAt?: SortOrder
    verificationNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkerProfileAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type WorkerProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    middleName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalCode?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    genderIdentity?: SortOrder
    experience?: SortOrder
    introduction?: SortOrder
    qualifications?: SortOrder
    hasVehicle?: SortOrder
    funFact?: SortOrder
    hobbies?: SortOrder
    uniqueService?: SortOrder
    whyEnjoyWork?: SortOrder
    additionalInfo?: SortOrder
    consentProfileShare?: SortOrder
    consentMarketing?: SortOrder
    profileCompleted?: SortOrder
    isPublished?: SortOrder
    verificationStatus?: SortOrder
    verificationSubmittedAt?: SortOrder
    verificationReviewedAt?: SortOrder
    verificationApprovedAt?: SortOrder
    verificationRejectedAt?: SortOrder
    verificationNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkerProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    middleName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalCode?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    genderIdentity?: SortOrder
    experience?: SortOrder
    introduction?: SortOrder
    qualifications?: SortOrder
    hasVehicle?: SortOrder
    funFact?: SortOrder
    hobbies?: SortOrder
    uniqueService?: SortOrder
    whyEnjoyWork?: SortOrder
    additionalInfo?: SortOrder
    consentProfileShare?: SortOrder
    consentMarketing?: SortOrder
    profileCompleted?: SortOrder
    isPublished?: SortOrder
    verificationStatus?: SortOrder
    verificationSubmittedAt?: SortOrder
    verificationReviewedAt?: SortOrder
    verificationApprovedAt?: SortOrder
    verificationRejectedAt?: SortOrder
    verificationNotes?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WorkerProfileSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type EnumDocumentCategoryNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentCategory | EnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    in?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel> | $Enums.DocumentCategory | null
  }

  export type EnumRequirementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RequirementStatus | EnumRequirementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRequirementStatusFilter<$PrismaModel> | $Enums.RequirementStatus
  }

  export type WorkerProfileScalarRelationFilter = {
    is?: WorkerProfileWhereInput
    isNot?: WorkerProfileWhereInput
  }

  export type VerificationRequirementCountOrderByAggregateInput = {
    id?: SortOrder
    workerProfileId?: SortOrder
    requirementType?: SortOrder
    requirementName?: SortOrder
    documentCategory?: SortOrder
    isRequired?: SortOrder
    status?: SortOrder
    documentUrl?: SortOrder
    documentUploadedAt?: SortOrder
    submittedAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedBy?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    rejectionReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationRequirementMaxOrderByAggregateInput = {
    id?: SortOrder
    workerProfileId?: SortOrder
    requirementType?: SortOrder
    requirementName?: SortOrder
    documentCategory?: SortOrder
    isRequired?: SortOrder
    status?: SortOrder
    documentUrl?: SortOrder
    documentUploadedAt?: SortOrder
    submittedAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedBy?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    rejectionReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type VerificationRequirementMinOrderByAggregateInput = {
    id?: SortOrder
    workerProfileId?: SortOrder
    requirementType?: SortOrder
    requirementName?: SortOrder
    documentCategory?: SortOrder
    isRequired?: SortOrder
    status?: SortOrder
    documentUrl?: SortOrder
    documentUploadedAt?: SortOrder
    submittedAt?: SortOrder
    reviewedAt?: SortOrder
    reviewedBy?: SortOrder
    approvedAt?: SortOrder
    rejectedAt?: SortOrder
    expiresAt?: SortOrder
    notes?: SortOrder
    rejectionReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumDocumentCategoryNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentCategory | EnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    in?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDocumentCategoryNullableWithAggregatesFilter<$PrismaModel> | $Enums.DocumentCategory | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel>
    _max?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel>
  }

  export type EnumRequirementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RequirementStatus | EnumRequirementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRequirementStatusWithAggregatesFilter<$PrismaModel> | $Enums.RequirementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRequirementStatusFilter<$PrismaModel>
    _max?: NestedEnumRequirementStatusFilter<$PrismaModel>
  }

  export type ClientProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClientProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ClientProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoordinatorProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    organization?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoordinatorProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    organization?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoordinatorProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    mobile?: SortOrder
    organization?: SortOrder
    location?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumAuditActionFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionFilter<$PrismaModel> | $Enums.AuditAction
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type AuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumAuditActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionWithAggregatesFilter<$PrismaModel> | $Enums.AuditAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuditActionFilter<$PrismaModel>
    _max?: NestedEnumAuditActionFilter<$PrismaModel>
  }

  export type AccountCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type WorkerProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutUserInput
    connect?: WorkerProfileWhereUniqueInput
  }

  export type ClientProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: ClientProfileCreateOrConnectWithoutUserInput
    connect?: ClientProfileWhereUniqueInput
  }

  export type CoordinatorProfileCreateNestedOneWithoutUserInput = {
    create?: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoordinatorProfileCreateOrConnectWithoutUserInput
    connect?: CoordinatorProfileWhereUniqueInput
  }

  export type AuditLogCreateNestedManyWithoutUserInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
  }

  export type AccountUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type WorkerProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutUserInput
    connect?: WorkerProfileWhereUniqueInput
  }

  export type ClientProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: ClientProfileCreateOrConnectWithoutUserInput
    connect?: ClientProfileWhereUniqueInput
  }

  export type CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoordinatorProfileCreateOrConnectWithoutUserInput
    connect?: CoordinatorProfileWhereUniqueInput
  }

  export type AuditLogUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type EnumAccountStatusFieldUpdateOperationsInput = {
    set?: $Enums.AccountStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type AccountUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type WorkerProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutUserInput
    upsert?: WorkerProfileUpsertWithoutUserInput
    disconnect?: WorkerProfileWhereInput | boolean
    delete?: WorkerProfileWhereInput | boolean
    connect?: WorkerProfileWhereUniqueInput
    update?: XOR<XOR<WorkerProfileUpdateToOneWithWhereWithoutUserInput, WorkerProfileUpdateWithoutUserInput>, WorkerProfileUncheckedUpdateWithoutUserInput>
  }

  export type ClientProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: ClientProfileCreateOrConnectWithoutUserInput
    upsert?: ClientProfileUpsertWithoutUserInput
    disconnect?: ClientProfileWhereInput | boolean
    delete?: ClientProfileWhereInput | boolean
    connect?: ClientProfileWhereUniqueInput
    update?: XOR<XOR<ClientProfileUpdateToOneWithWhereWithoutUserInput, ClientProfileUpdateWithoutUserInput>, ClientProfileUncheckedUpdateWithoutUserInput>
  }

  export type CoordinatorProfileUpdateOneWithoutUserNestedInput = {
    create?: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoordinatorProfileCreateOrConnectWithoutUserInput
    upsert?: CoordinatorProfileUpsertWithoutUserInput
    disconnect?: CoordinatorProfileWhereInput | boolean
    delete?: CoordinatorProfileWhereInput | boolean
    connect?: CoordinatorProfileWhereUniqueInput
    update?: XOR<XOR<CoordinatorProfileUpdateToOneWithWhereWithoutUserInput, CoordinatorProfileUpdateWithoutUserInput>, CoordinatorProfileUncheckedUpdateWithoutUserInput>
  }

  export type AuditLogUpdateManyWithoutUserNestedInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    upsert?: AuditLogUpsertWithWhereUniqueWithoutUserInput | AuditLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    set?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    disconnect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    delete?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    update?: AuditLogUpdateWithWhereUniqueWithoutUserInput | AuditLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AuditLogUpdateManyWithWhereWithoutUserInput | AuditLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
  }

  export type AccountUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type WorkerProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutUserInput
    upsert?: WorkerProfileUpsertWithoutUserInput
    disconnect?: WorkerProfileWhereInput | boolean
    delete?: WorkerProfileWhereInput | boolean
    connect?: WorkerProfileWhereUniqueInput
    update?: XOR<XOR<WorkerProfileUpdateToOneWithWhereWithoutUserInput, WorkerProfileUpdateWithoutUserInput>, WorkerProfileUncheckedUpdateWithoutUserInput>
  }

  export type ClientProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: ClientProfileCreateOrConnectWithoutUserInput
    upsert?: ClientProfileUpsertWithoutUserInput
    disconnect?: ClientProfileWhereInput | boolean
    delete?: ClientProfileWhereInput | boolean
    connect?: ClientProfileWhereUniqueInput
    update?: XOR<XOR<ClientProfileUpdateToOneWithWhereWithoutUserInput, ClientProfileUpdateWithoutUserInput>, ClientProfileUncheckedUpdateWithoutUserInput>
  }

  export type CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
    connectOrCreate?: CoordinatorProfileCreateOrConnectWithoutUserInput
    upsert?: CoordinatorProfileUpsertWithoutUserInput
    disconnect?: CoordinatorProfileWhereInput | boolean
    delete?: CoordinatorProfileWhereInput | boolean
    connect?: CoordinatorProfileWhereUniqueInput
    update?: XOR<XOR<CoordinatorProfileUpdateToOneWithWhereWithoutUserInput, CoordinatorProfileUpdateWithoutUserInput>, CoordinatorProfileUncheckedUpdateWithoutUserInput>
  }

  export type AuditLogUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput> | AuditLogCreateWithoutUserInput[] | AuditLogUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AuditLogCreateOrConnectWithoutUserInput | AuditLogCreateOrConnectWithoutUserInput[]
    upsert?: AuditLogUpsertWithWhereUniqueWithoutUserInput | AuditLogUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AuditLogCreateManyUserInputEnvelope
    set?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    disconnect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    delete?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    connect?: AuditLogWhereUniqueInput | AuditLogWhereUniqueInput[]
    update?: AuditLogUpdateWithWhereUniqueWithoutUserInput | AuditLogUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AuditLogUpdateManyWithWhereWithoutUserInput | AuditLogUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutAccountsInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    connect?: UserWhereUniqueInput
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutAccountsNestedInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    upsert?: UserUpsertWithoutAccountsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAccountsInput, UserUpdateWithoutAccountsInput>, UserUncheckedUpdateWithoutAccountsInput>
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type WorkerProfileCreatelanguagesInput = {
    set: string[]
  }

  export type WorkerProfileCreateservicesInput = {
    set: string[]
  }

  export type WorkerProfileCreatesupportWorkerCategoriesInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutWorkerProfileInput = {
    create?: XOR<UserCreateWithoutWorkerProfileInput, UserUncheckedCreateWithoutWorkerProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutWorkerProfileInput
    connect?: UserWhereUniqueInput
  }

  export type VerificationRequirementCreateNestedManyWithoutWorkerProfileInput = {
    create?: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput> | VerificationRequirementCreateWithoutWorkerProfileInput[] | VerificationRequirementUncheckedCreateWithoutWorkerProfileInput[]
    connectOrCreate?: VerificationRequirementCreateOrConnectWithoutWorkerProfileInput | VerificationRequirementCreateOrConnectWithoutWorkerProfileInput[]
    createMany?: VerificationRequirementCreateManyWorkerProfileInputEnvelope
    connect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
  }

  export type VerificationRequirementUncheckedCreateNestedManyWithoutWorkerProfileInput = {
    create?: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput> | VerificationRequirementCreateWithoutWorkerProfileInput[] | VerificationRequirementUncheckedCreateWithoutWorkerProfileInput[]
    connectOrCreate?: VerificationRequirementCreateOrConnectWithoutWorkerProfileInput | VerificationRequirementCreateOrConnectWithoutWorkerProfileInput[]
    createMany?: VerificationRequirementCreateManyWorkerProfileInputEnvelope
    connect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type WorkerProfileUpdatelanguagesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type WorkerProfileUpdateservicesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type WorkerProfileUpdatesupportWorkerCategoriesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumVerificationStatusFieldUpdateOperationsInput = {
    set?: $Enums.VerificationStatus
  }

  export type UserUpdateOneRequiredWithoutWorkerProfileNestedInput = {
    create?: XOR<UserCreateWithoutWorkerProfileInput, UserUncheckedCreateWithoutWorkerProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutWorkerProfileInput
    upsert?: UserUpsertWithoutWorkerProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutWorkerProfileInput, UserUpdateWithoutWorkerProfileInput>, UserUncheckedUpdateWithoutWorkerProfileInput>
  }

  export type VerificationRequirementUpdateManyWithoutWorkerProfileNestedInput = {
    create?: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput> | VerificationRequirementCreateWithoutWorkerProfileInput[] | VerificationRequirementUncheckedCreateWithoutWorkerProfileInput[]
    connectOrCreate?: VerificationRequirementCreateOrConnectWithoutWorkerProfileInput | VerificationRequirementCreateOrConnectWithoutWorkerProfileInput[]
    upsert?: VerificationRequirementUpsertWithWhereUniqueWithoutWorkerProfileInput | VerificationRequirementUpsertWithWhereUniqueWithoutWorkerProfileInput[]
    createMany?: VerificationRequirementCreateManyWorkerProfileInputEnvelope
    set?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    disconnect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    delete?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    connect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    update?: VerificationRequirementUpdateWithWhereUniqueWithoutWorkerProfileInput | VerificationRequirementUpdateWithWhereUniqueWithoutWorkerProfileInput[]
    updateMany?: VerificationRequirementUpdateManyWithWhereWithoutWorkerProfileInput | VerificationRequirementUpdateManyWithWhereWithoutWorkerProfileInput[]
    deleteMany?: VerificationRequirementScalarWhereInput | VerificationRequirementScalarWhereInput[]
  }

  export type VerificationRequirementUncheckedUpdateManyWithoutWorkerProfileNestedInput = {
    create?: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput> | VerificationRequirementCreateWithoutWorkerProfileInput[] | VerificationRequirementUncheckedCreateWithoutWorkerProfileInput[]
    connectOrCreate?: VerificationRequirementCreateOrConnectWithoutWorkerProfileInput | VerificationRequirementCreateOrConnectWithoutWorkerProfileInput[]
    upsert?: VerificationRequirementUpsertWithWhereUniqueWithoutWorkerProfileInput | VerificationRequirementUpsertWithWhereUniqueWithoutWorkerProfileInput[]
    createMany?: VerificationRequirementCreateManyWorkerProfileInputEnvelope
    set?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    disconnect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    delete?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    connect?: VerificationRequirementWhereUniqueInput | VerificationRequirementWhereUniqueInput[]
    update?: VerificationRequirementUpdateWithWhereUniqueWithoutWorkerProfileInput | VerificationRequirementUpdateWithWhereUniqueWithoutWorkerProfileInput[]
    updateMany?: VerificationRequirementUpdateManyWithWhereWithoutWorkerProfileInput | VerificationRequirementUpdateManyWithWhereWithoutWorkerProfileInput[]
    deleteMany?: VerificationRequirementScalarWhereInput | VerificationRequirementScalarWhereInput[]
  }

  export type WorkerProfileCreateNestedOneWithoutVerificationRequirementsInput = {
    create?: XOR<WorkerProfileCreateWithoutVerificationRequirementsInput, WorkerProfileUncheckedCreateWithoutVerificationRequirementsInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutVerificationRequirementsInput
    connect?: WorkerProfileWhereUniqueInput
  }

  export type NullableEnumDocumentCategoryFieldUpdateOperationsInput = {
    set?: $Enums.DocumentCategory | null
  }

  export type EnumRequirementStatusFieldUpdateOperationsInput = {
    set?: $Enums.RequirementStatus
  }

  export type WorkerProfileUpdateOneRequiredWithoutVerificationRequirementsNestedInput = {
    create?: XOR<WorkerProfileCreateWithoutVerificationRequirementsInput, WorkerProfileUncheckedCreateWithoutVerificationRequirementsInput>
    connectOrCreate?: WorkerProfileCreateOrConnectWithoutVerificationRequirementsInput
    upsert?: WorkerProfileUpsertWithoutVerificationRequirementsInput
    connect?: WorkerProfileWhereUniqueInput
    update?: XOR<XOR<WorkerProfileUpdateToOneWithWhereWithoutVerificationRequirementsInput, WorkerProfileUpdateWithoutVerificationRequirementsInput>, WorkerProfileUncheckedUpdateWithoutVerificationRequirementsInput>
  }

  export type UserCreateNestedOneWithoutClientProfileInput = {
    create?: XOR<UserCreateWithoutClientProfileInput, UserUncheckedCreateWithoutClientProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutClientProfileInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutClientProfileNestedInput = {
    create?: XOR<UserCreateWithoutClientProfileInput, UserUncheckedCreateWithoutClientProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutClientProfileInput
    upsert?: UserUpsertWithoutClientProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutClientProfileInput, UserUpdateWithoutClientProfileInput>, UserUncheckedUpdateWithoutClientProfileInput>
  }

  export type UserCreateNestedOneWithoutCoordinatorProfileInput = {
    create?: XOR<UserCreateWithoutCoordinatorProfileInput, UserUncheckedCreateWithoutCoordinatorProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoordinatorProfileInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutCoordinatorProfileNestedInput = {
    create?: XOR<UserCreateWithoutCoordinatorProfileInput, UserUncheckedCreateWithoutCoordinatorProfileInput>
    connectOrCreate?: UserCreateOrConnectWithoutCoordinatorProfileInput
    upsert?: UserUpsertWithoutCoordinatorProfileInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCoordinatorProfileInput, UserUpdateWithoutCoordinatorProfileInput>, UserUncheckedUpdateWithoutCoordinatorProfileInput>
  }

  export type UserCreateNestedOneWithoutAuditLogsInput = {
    create?: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuditLogsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumAuditActionFieldUpdateOperationsInput = {
    set?: $Enums.AuditAction
  }

  export type UserUpdateOneWithoutAuditLogsNestedInput = {
    create?: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAuditLogsInput
    upsert?: UserUpsertWithoutAuditLogsInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAuditLogsInput, UserUpdateWithoutAuditLogsInput>, UserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedEnumAccountStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountStatus | EnumAccountStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountStatusFilter<$PrismaModel> | $Enums.AccountStatus
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedEnumAccountStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountStatus | EnumAccountStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountStatus[] | ListEnumAccountStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountStatusWithAggregatesFilter<$PrismaModel> | $Enums.AccountStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountStatusFilter<$PrismaModel>
    _max?: NestedEnumAccountStatusFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumVerificationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusFilter<$PrismaModel> | $Enums.VerificationStatus
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationStatus | EnumVerificationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationStatus[] | ListEnumVerificationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationStatusWithAggregatesFilter<$PrismaModel> | $Enums.VerificationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationStatusFilter<$PrismaModel>
    _max?: NestedEnumVerificationStatusFilter<$PrismaModel>
  }

  export type NestedEnumDocumentCategoryNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentCategory | EnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    in?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel> | $Enums.DocumentCategory | null
  }

  export type NestedEnumRequirementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RequirementStatus | EnumRequirementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRequirementStatusFilter<$PrismaModel> | $Enums.RequirementStatus
  }

  export type NestedEnumDocumentCategoryNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DocumentCategory | EnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    in?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.DocumentCategory[] | ListEnumDocumentCategoryFieldRefInput<$PrismaModel> | null
    not?: NestedEnumDocumentCategoryNullableWithAggregatesFilter<$PrismaModel> | $Enums.DocumentCategory | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel>
    _max?: NestedEnumDocumentCategoryNullableFilter<$PrismaModel>
  }

  export type NestedEnumRequirementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RequirementStatus | EnumRequirementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RequirementStatus[] | ListEnumRequirementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRequirementStatusWithAggregatesFilter<$PrismaModel> | $Enums.RequirementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRequirementStatusFilter<$PrismaModel>
    _max?: NestedEnumRequirementStatusFilter<$PrismaModel>
  }

  export type NestedEnumAuditActionFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionFilter<$PrismaModel> | $Enums.AuditAction
  }

  export type NestedEnumAuditActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionWithAggregatesFilter<$PrismaModel> | $Enums.AuditAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuditActionFilter<$PrismaModel>
    _max?: NestedEnumAuditActionFilter<$PrismaModel>
  }

  export type AccountCreateWithoutUserInput = {
    id?: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
  }

  export type AccountUncheckedCreateWithoutUserInput = {
    id?: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
  }

  export type AccountCreateOrConnectWithoutUserInput = {
    where: AccountWhereUniqueInput
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountCreateManyUserInputEnvelope = {
    data: AccountCreateManyUserInput | AccountCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SessionCreateWithoutUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type WorkerProfileCreateWithoutUserInput = {
    id?: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    verificationRequirements?: VerificationRequirementCreateNestedManyWithoutWorkerProfileInput
  }

  export type WorkerProfileUncheckedCreateWithoutUserInput = {
    id?: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    verificationRequirements?: VerificationRequirementUncheckedCreateNestedManyWithoutWorkerProfileInput
  }

  export type WorkerProfileCreateOrConnectWithoutUserInput = {
    where: WorkerProfileWhereUniqueInput
    create: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
  }

  export type ClientProfileCreateWithoutUserInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClientProfileUncheckedCreateWithoutUserInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ClientProfileCreateOrConnectWithoutUserInput = {
    where: ClientProfileWhereUniqueInput
    create: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
  }

  export type CoordinatorProfileCreateWithoutUserInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    organization?: string | null
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoordinatorProfileUncheckedCreateWithoutUserInput = {
    id?: string
    firstName: string
    lastName: string
    mobile: string
    organization?: string | null
    location?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoordinatorProfileCreateOrConnectWithoutUserInput = {
    where: CoordinatorProfileWhereUniqueInput
    create: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
  }

  export type AuditLogCreateWithoutUserInput = {
    id?: string
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditLogUncheckedCreateWithoutUserInput = {
    id?: string
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditLogCreateOrConnectWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    create: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput>
  }

  export type AuditLogCreateManyUserInputEnvelope = {
    data: AuditLogCreateManyUserInput | AuditLogCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type AccountUpsertWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    update: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountUpdateWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    data: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
  }

  export type AccountUpdateManyWithWhereWithoutUserInput = {
    where: AccountScalarWhereInput
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyWithoutUserInput>
  }

  export type AccountScalarWhereInput = {
    AND?: AccountScalarWhereInput | AccountScalarWhereInput[]
    OR?: AccountScalarWhereInput[]
    NOT?: AccountScalarWhereInput | AccountScalarWhereInput[]
    id?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    type?: StringFilter<"Account"> | string
    provider?: StringFilter<"Account"> | string
    providerAccountId?: StringFilter<"Account"> | string
    refresh_token?: StringNullableFilter<"Account"> | string | null
    access_token?: StringNullableFilter<"Account"> | string | null
    expires_at?: IntNullableFilter<"Account"> | number | null
    token_type?: StringNullableFilter<"Account"> | string | null
    scope?: StringNullableFilter<"Account"> | string | null
    id_token?: StringNullableFilter<"Account"> | string | null
    session_state?: StringNullableFilter<"Account"> | string | null
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    sessionToken?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
  }

  export type WorkerProfileUpsertWithoutUserInput = {
    update: XOR<WorkerProfileUpdateWithoutUserInput, WorkerProfileUncheckedUpdateWithoutUserInput>
    create: XOR<WorkerProfileCreateWithoutUserInput, WorkerProfileUncheckedCreateWithoutUserInput>
    where?: WorkerProfileWhereInput
  }

  export type WorkerProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: WorkerProfileWhereInput
    data: XOR<WorkerProfileUpdateWithoutUserInput, WorkerProfileUncheckedUpdateWithoutUserInput>
  }

  export type WorkerProfileUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verificationRequirements?: VerificationRequirementUpdateManyWithoutWorkerProfileNestedInput
  }

  export type WorkerProfileUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    verificationRequirements?: VerificationRequirementUncheckedUpdateManyWithoutWorkerProfileNestedInput
  }

  export type ClientProfileUpsertWithoutUserInput = {
    update: XOR<ClientProfileUpdateWithoutUserInput, ClientProfileUncheckedUpdateWithoutUserInput>
    create: XOR<ClientProfileCreateWithoutUserInput, ClientProfileUncheckedCreateWithoutUserInput>
    where?: ClientProfileWhereInput
  }

  export type ClientProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: ClientProfileWhereInput
    data: XOR<ClientProfileUpdateWithoutUserInput, ClientProfileUncheckedUpdateWithoutUserInput>
  }

  export type ClientProfileUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ClientProfileUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoordinatorProfileUpsertWithoutUserInput = {
    update: XOR<CoordinatorProfileUpdateWithoutUserInput, CoordinatorProfileUncheckedUpdateWithoutUserInput>
    create: XOR<CoordinatorProfileCreateWithoutUserInput, CoordinatorProfileUncheckedCreateWithoutUserInput>
    where?: CoordinatorProfileWhereInput
  }

  export type CoordinatorProfileUpdateToOneWithWhereWithoutUserInput = {
    where?: CoordinatorProfileWhereInput
    data: XOR<CoordinatorProfileUpdateWithoutUserInput, CoordinatorProfileUncheckedUpdateWithoutUserInput>
  }

  export type CoordinatorProfileUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoordinatorProfileUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    organization?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUpsertWithWhereUniqueWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    update: XOR<AuditLogUpdateWithoutUserInput, AuditLogUncheckedUpdateWithoutUserInput>
    create: XOR<AuditLogCreateWithoutUserInput, AuditLogUncheckedCreateWithoutUserInput>
  }

  export type AuditLogUpdateWithWhereUniqueWithoutUserInput = {
    where: AuditLogWhereUniqueInput
    data: XOR<AuditLogUpdateWithoutUserInput, AuditLogUncheckedUpdateWithoutUserInput>
  }

  export type AuditLogUpdateManyWithWhereWithoutUserInput = {
    where: AuditLogScalarWhereInput
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyWithoutUserInput>
  }

  export type AuditLogScalarWhereInput = {
    AND?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
    OR?: AuditLogScalarWhereInput[]
    NOT?: AuditLogScalarWhereInput | AuditLogScalarWhereInput[]
    id?: StringFilter<"AuditLog"> | string
    userId?: StringNullableFilter<"AuditLog"> | string | null
    action?: EnumAuditActionFilter<"AuditLog"> | $Enums.AuditAction
    ipAddress?: StringNullableFilter<"AuditLog"> | string | null
    userAgent?: StringNullableFilter<"AuditLog"> | string | null
    metadata?: JsonNullableFilter<"AuditLog">
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
  }

  export type UserCreateWithoutAccountsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: SessionCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAccountsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAccountsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
  }

  export type UserUpsertWithoutAccountsInput = {
    update: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAccountsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
  }

  export type UserUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutWorkerProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutWorkerProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutWorkerProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutWorkerProfileInput, UserUncheckedCreateWithoutWorkerProfileInput>
  }

  export type VerificationRequirementCreateWithoutWorkerProfileInput = {
    id?: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationRequirementUncheckedCreateWithoutWorkerProfileInput = {
    id?: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationRequirementCreateOrConnectWithoutWorkerProfileInput = {
    where: VerificationRequirementWhereUniqueInput
    create: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput>
  }

  export type VerificationRequirementCreateManyWorkerProfileInputEnvelope = {
    data: VerificationRequirementCreateManyWorkerProfileInput | VerificationRequirementCreateManyWorkerProfileInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutWorkerProfileInput = {
    update: XOR<UserUpdateWithoutWorkerProfileInput, UserUncheckedUpdateWithoutWorkerProfileInput>
    create: XOR<UserCreateWithoutWorkerProfileInput, UserUncheckedCreateWithoutWorkerProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutWorkerProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutWorkerProfileInput, UserUncheckedUpdateWithoutWorkerProfileInput>
  }

  export type UserUpdateWithoutWorkerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutWorkerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type VerificationRequirementUpsertWithWhereUniqueWithoutWorkerProfileInput = {
    where: VerificationRequirementWhereUniqueInput
    update: XOR<VerificationRequirementUpdateWithoutWorkerProfileInput, VerificationRequirementUncheckedUpdateWithoutWorkerProfileInput>
    create: XOR<VerificationRequirementCreateWithoutWorkerProfileInput, VerificationRequirementUncheckedCreateWithoutWorkerProfileInput>
  }

  export type VerificationRequirementUpdateWithWhereUniqueWithoutWorkerProfileInput = {
    where: VerificationRequirementWhereUniqueInput
    data: XOR<VerificationRequirementUpdateWithoutWorkerProfileInput, VerificationRequirementUncheckedUpdateWithoutWorkerProfileInput>
  }

  export type VerificationRequirementUpdateManyWithWhereWithoutWorkerProfileInput = {
    where: VerificationRequirementScalarWhereInput
    data: XOR<VerificationRequirementUpdateManyMutationInput, VerificationRequirementUncheckedUpdateManyWithoutWorkerProfileInput>
  }

  export type VerificationRequirementScalarWhereInput = {
    AND?: VerificationRequirementScalarWhereInput | VerificationRequirementScalarWhereInput[]
    OR?: VerificationRequirementScalarWhereInput[]
    NOT?: VerificationRequirementScalarWhereInput | VerificationRequirementScalarWhereInput[]
    id?: StringFilter<"VerificationRequirement"> | string
    workerProfileId?: StringFilter<"VerificationRequirement"> | string
    requirementType?: StringFilter<"VerificationRequirement"> | string
    requirementName?: StringFilter<"VerificationRequirement"> | string
    documentCategory?: EnumDocumentCategoryNullableFilter<"VerificationRequirement"> | $Enums.DocumentCategory | null
    isRequired?: BoolFilter<"VerificationRequirement"> | boolean
    status?: EnumRequirementStatusFilter<"VerificationRequirement"> | $Enums.RequirementStatus
    documentUrl?: StringNullableFilter<"VerificationRequirement"> | string | null
    documentUploadedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    submittedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    reviewedBy?: StringNullableFilter<"VerificationRequirement"> | string | null
    approvedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    rejectedAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"VerificationRequirement"> | Date | string | null
    notes?: StringNullableFilter<"VerificationRequirement"> | string | null
    rejectionReason?: StringNullableFilter<"VerificationRequirement"> | string | null
    createdAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
    updatedAt?: DateTimeFilter<"VerificationRequirement"> | Date | string
  }

  export type WorkerProfileCreateWithoutVerificationRequirementsInput = {
    id?: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutWorkerProfileInput
  }

  export type WorkerProfileUncheckedCreateWithoutVerificationRequirementsInput = {
    id?: string
    userId: string
    firstName: string
    middleName?: string | null
    lastName: string
    mobile: string
    location: string
    latitude?: number | null
    longitude?: number | null
    city?: string | null
    state?: string | null
    postalCode?: string | null
    age: string
    gender: string
    genderIdentity: string
    languages?: WorkerProfileCreatelanguagesInput | string[]
    services?: WorkerProfileCreateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileCreatesupportWorkerCategoriesInput | string[]
    experience: string
    introduction: string
    qualifications: string
    hasVehicle: string
    funFact: string
    hobbies: string
    uniqueService: string
    whyEnjoyWork: string
    additionalInfo?: string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: boolean
    consentMarketing?: boolean
    profileCompleted?: boolean
    isPublished?: boolean
    verificationStatus?: $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: Date | string | null
    verificationReviewedAt?: Date | string | null
    verificationApprovedAt?: Date | string | null
    verificationRejectedAt?: Date | string | null
    verificationNotes?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WorkerProfileCreateOrConnectWithoutVerificationRequirementsInput = {
    where: WorkerProfileWhereUniqueInput
    create: XOR<WorkerProfileCreateWithoutVerificationRequirementsInput, WorkerProfileUncheckedCreateWithoutVerificationRequirementsInput>
  }

  export type WorkerProfileUpsertWithoutVerificationRequirementsInput = {
    update: XOR<WorkerProfileUpdateWithoutVerificationRequirementsInput, WorkerProfileUncheckedUpdateWithoutVerificationRequirementsInput>
    create: XOR<WorkerProfileCreateWithoutVerificationRequirementsInput, WorkerProfileUncheckedCreateWithoutVerificationRequirementsInput>
    where?: WorkerProfileWhereInput
  }

  export type WorkerProfileUpdateToOneWithWhereWithoutVerificationRequirementsInput = {
    where?: WorkerProfileWhereInput
    data: XOR<WorkerProfileUpdateWithoutVerificationRequirementsInput, WorkerProfileUncheckedUpdateWithoutVerificationRequirementsInput>
  }

  export type WorkerProfileUpdateWithoutVerificationRequirementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutWorkerProfileNestedInput
  }

  export type WorkerProfileUncheckedUpdateWithoutVerificationRequirementsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    middleName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: StringFieldUpdateOperationsInput | string
    mobile?: StringFieldUpdateOperationsInput | string
    location?: StringFieldUpdateOperationsInput | string
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    age?: StringFieldUpdateOperationsInput | string
    gender?: StringFieldUpdateOperationsInput | string
    genderIdentity?: StringFieldUpdateOperationsInput | string
    languages?: WorkerProfileUpdatelanguagesInput | string[]
    services?: WorkerProfileUpdateservicesInput | string[]
    supportWorkerCategories?: WorkerProfileUpdatesupportWorkerCategoriesInput | string[]
    experience?: StringFieldUpdateOperationsInput | string
    introduction?: StringFieldUpdateOperationsInput | string
    qualifications?: StringFieldUpdateOperationsInput | string
    hasVehicle?: StringFieldUpdateOperationsInput | string
    funFact?: StringFieldUpdateOperationsInput | string
    hobbies?: StringFieldUpdateOperationsInput | string
    uniqueService?: StringFieldUpdateOperationsInput | string
    whyEnjoyWork?: StringFieldUpdateOperationsInput | string
    additionalInfo?: NullableStringFieldUpdateOperationsInput | string | null
    photos?: NullableJsonNullValueInput | InputJsonValue
    consentProfileShare?: BoolFieldUpdateOperationsInput | boolean
    consentMarketing?: BoolFieldUpdateOperationsInput | boolean
    profileCompleted?: BoolFieldUpdateOperationsInput | boolean
    isPublished?: BoolFieldUpdateOperationsInput | boolean
    verificationStatus?: EnumVerificationStatusFieldUpdateOperationsInput | $Enums.VerificationStatus
    verificationChecklist?: NullableJsonNullValueInput | InputJsonValue
    submittedDocuments?: NullableJsonNullValueInput | InputJsonValue
    verificationSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationReviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationApprovedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationRejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    verificationNotes?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutClientProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutClientProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutClientProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutClientProfileInput, UserUncheckedCreateWithoutClientProfileInput>
  }

  export type UserUpsertWithoutClientProfileInput = {
    update: XOR<UserUpdateWithoutClientProfileInput, UserUncheckedUpdateWithoutClientProfileInput>
    create: XOR<UserCreateWithoutClientProfileInput, UserUncheckedCreateWithoutClientProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutClientProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutClientProfileInput, UserUncheckedUpdateWithoutClientProfileInput>
  }

  export type UserUpdateWithoutClientProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutClientProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutCoordinatorProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCoordinatorProfileInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    auditLogs?: AuditLogUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCoordinatorProfileInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCoordinatorProfileInput, UserUncheckedCreateWithoutCoordinatorProfileInput>
  }

  export type UserUpsertWithoutCoordinatorProfileInput = {
    update: XOR<UserUpdateWithoutCoordinatorProfileInput, UserUncheckedUpdateWithoutCoordinatorProfileInput>
    create: XOR<UserCreateWithoutCoordinatorProfileInput, UserUncheckedCreateWithoutCoordinatorProfileInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCoordinatorProfileInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCoordinatorProfileInput, UserUncheckedUpdateWithoutCoordinatorProfileInput>
  }

  export type UserUpdateWithoutCoordinatorProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCoordinatorProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    auditLogs?: AuditLogUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutAuditLogsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAuditLogsInput = {
    id?: string
    email: string
    passwordHash: string
    role: $Enums.UserRole
    status?: $Enums.AccountStatus
    resetPasswordToken?: string | null
    resetPasswordExpires?: Date | string | null
    failedLoginAttempts?: number
    accountLockedUntil?: Date | string | null
    lastLoginAt?: Date | string | null
    lastLoginIp?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    workerProfile?: WorkerProfileUncheckedCreateNestedOneWithoutUserInput
    clientProfile?: ClientProfileUncheckedCreateNestedOneWithoutUserInput
    coordinatorProfile?: CoordinatorProfileUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAuditLogsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
  }

  export type UserUpsertWithoutAuditLogsInput = {
    update: XOR<UserUpdateWithoutAuditLogsInput, UserUncheckedUpdateWithoutAuditLogsInput>
    create: XOR<UserCreateWithoutAuditLogsInput, UserUncheckedCreateWithoutAuditLogsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAuditLogsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAuditLogsInput, UserUncheckedUpdateWithoutAuditLogsInput>
  }

  export type UserUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAuditLogsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    status?: EnumAccountStatusFieldUpdateOperationsInput | $Enums.AccountStatus
    resetPasswordToken?: NullableStringFieldUpdateOperationsInput | string | null
    resetPasswordExpires?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    failedLoginAttempts?: IntFieldUpdateOperationsInput | number
    accountLockedUntil?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastLoginIp?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    workerProfile?: WorkerProfileUncheckedUpdateOneWithoutUserNestedInput
    clientProfile?: ClientProfileUncheckedUpdateOneWithoutUserNestedInput
    coordinatorProfile?: CoordinatorProfileUncheckedUpdateOneWithoutUserNestedInput
  }

  export type AccountCreateManyUserInput = {
    id?: string
    type: string
    provider: string
    providerAccountId: string
    refresh_token?: string | null
    access_token?: string | null
    expires_at?: number | null
    token_type?: string | null
    scope?: string | null
    id_token?: string | null
    session_state?: string | null
  }

  export type SessionCreateManyUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
  }

  export type AuditLogCreateManyUserInput = {
    id?: string
    action: $Enums.AuditAction
    ipAddress?: string | null
    userAgent?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AccountUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AccountUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AccountUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refresh_token?: NullableStringFieldUpdateOperationsInput | string | null
    access_token?: NullableStringFieldUpdateOperationsInput | string | null
    expires_at?: NullableIntFieldUpdateOperationsInput | number | null
    token_type?: NullableStringFieldUpdateOperationsInput | string | null
    scope?: NullableStringFieldUpdateOperationsInput | string | null
    id_token?: NullableStringFieldUpdateOperationsInput | string | null
    session_state?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementCreateManyWorkerProfileInput = {
    id?: string
    requirementType: string
    requirementName: string
    documentCategory?: $Enums.DocumentCategory | null
    isRequired?: boolean
    status?: $Enums.RequirementStatus
    documentUrl?: string | null
    documentUploadedAt?: Date | string | null
    submittedAt?: Date | string | null
    reviewedAt?: Date | string | null
    reviewedBy?: string | null
    approvedAt?: Date | string | null
    rejectedAt?: Date | string | null
    expiresAt?: Date | string | null
    notes?: string | null
    rejectionReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type VerificationRequirementUpdateWithoutWorkerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementUncheckedUpdateWithoutWorkerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationRequirementUncheckedUpdateManyWithoutWorkerProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    requirementType?: StringFieldUpdateOperationsInput | string
    requirementName?: StringFieldUpdateOperationsInput | string
    documentCategory?: NullableEnumDocumentCategoryFieldUpdateOperationsInput | $Enums.DocumentCategory | null
    isRequired?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumRequirementStatusFieldUpdateOperationsInput | $Enums.RequirementStatus
    documentUrl?: NullableStringFieldUpdateOperationsInput | string | null
    documentUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    reviewedBy?: NullableStringFieldUpdateOperationsInput | string | null
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    rejectedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    rejectionReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}