
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
 * Model ContractorProfile
 * 
 */
export type ContractorProfile = $Result.DefaultSelection<Prisma.$ContractorProfilePayload>
/**
 * Model ContractorsbyArea
 * 
 */
export type ContractorsbyArea = $Result.DefaultSelection<Prisma.$ContractorsbyAreaPayload>
/**
 * Model Job
 * 
 */
export type Job = $Result.DefaultSelection<Prisma.$JobPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ContractorProfiles
 * const contractorProfiles = await prisma.contractorProfile.findMany()
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
   * // Fetch zero or more ContractorProfiles
   * const contractorProfiles = await prisma.contractorProfile.findMany()
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
   * `prisma.contractorProfile`: Exposes CRUD operations for the **ContractorProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContractorProfiles
    * const contractorProfiles = await prisma.contractorProfile.findMany()
    * ```
    */
  get contractorProfile(): Prisma.ContractorProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.contractorsbyArea`: Exposes CRUD operations for the **ContractorsbyArea** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContractorsbyAreas
    * const contractorsbyAreas = await prisma.contractorsbyArea.findMany()
    * ```
    */
  get contractorsbyArea(): Prisma.ContractorsbyAreaDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.job`: Exposes CRUD operations for the **Job** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Jobs
    * const jobs = await prisma.job.findMany()
    * ```
    */
  get job(): Prisma.JobDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
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
    ContractorProfile: 'ContractorProfile',
    ContractorsbyArea: 'ContractorsbyArea',
    Job: 'Job'
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
      modelProps: "contractorProfile" | "contractorsbyArea" | "job"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ContractorProfile: {
        payload: Prisma.$ContractorProfilePayload<ExtArgs>
        fields: Prisma.ContractorProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContractorProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContractorProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          findFirst: {
            args: Prisma.ContractorProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContractorProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          findMany: {
            args: Prisma.ContractorProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>[]
          }
          create: {
            args: Prisma.ContractorProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          createMany: {
            args: Prisma.ContractorProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContractorProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>[]
          }
          delete: {
            args: Prisma.ContractorProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          update: {
            args: Prisma.ContractorProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          deleteMany: {
            args: Prisma.ContractorProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContractorProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContractorProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>[]
          }
          upsert: {
            args: Prisma.ContractorProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorProfilePayload>
          }
          aggregate: {
            args: Prisma.ContractorProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContractorProfile>
          }
          groupBy: {
            args: Prisma.ContractorProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContractorProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContractorProfileCountArgs<ExtArgs>
            result: $Utils.Optional<ContractorProfileCountAggregateOutputType> | number
          }
        }
      }
      ContractorsbyArea: {
        payload: Prisma.$ContractorsbyAreaPayload<ExtArgs>
        fields: Prisma.ContractorsbyAreaFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContractorsbyAreaFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContractorsbyAreaFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          findFirst: {
            args: Prisma.ContractorsbyAreaFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContractorsbyAreaFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          findMany: {
            args: Prisma.ContractorsbyAreaFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>[]
          }
          create: {
            args: Prisma.ContractorsbyAreaCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          createMany: {
            args: Prisma.ContractorsbyAreaCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContractorsbyAreaCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>[]
          }
          delete: {
            args: Prisma.ContractorsbyAreaDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          update: {
            args: Prisma.ContractorsbyAreaUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          deleteMany: {
            args: Prisma.ContractorsbyAreaDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContractorsbyAreaUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContractorsbyAreaUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>[]
          }
          upsert: {
            args: Prisma.ContractorsbyAreaUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractorsbyAreaPayload>
          }
          aggregate: {
            args: Prisma.ContractorsbyAreaAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContractorsbyArea>
          }
          groupBy: {
            args: Prisma.ContractorsbyAreaGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContractorsbyAreaGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContractorsbyAreaCountArgs<ExtArgs>
            result: $Utils.Optional<ContractorsbyAreaCountAggregateOutputType> | number
          }
        }
      }
      Job: {
        payload: Prisma.$JobPayload<ExtArgs>
        fields: Prisma.JobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.JobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.JobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          findFirst: {
            args: Prisma.JobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.JobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          findMany: {
            args: Prisma.JobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>[]
          }
          create: {
            args: Prisma.JobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          createMany: {
            args: Prisma.JobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.JobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>[]
          }
          delete: {
            args: Prisma.JobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          update: {
            args: Prisma.JobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          deleteMany: {
            args: Prisma.JobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.JobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.JobUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>[]
          }
          upsert: {
            args: Prisma.JobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$JobPayload>
          }
          aggregate: {
            args: Prisma.JobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateJob>
          }
          groupBy: {
            args: Prisma.JobGroupByArgs<ExtArgs>
            result: $Utils.Optional<JobGroupByOutputType>[]
          }
          count: {
            args: Prisma.JobCountArgs<ExtArgs>
            result: $Utils.Optional<JobCountAggregateOutputType> | number
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
    contractorProfile?: ContractorProfileOmit
    contractorsbyArea?: ContractorsbyAreaOmit
    job?: JobOmit
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
   * Models
   */

  /**
   * Model ContractorProfile
   */

  export type AggregateContractorProfile = {
    _count: ContractorProfileCountAggregateOutputType | null
    _avg: ContractorProfileAvgAggregateOutputType | null
    _sum: ContractorProfileSumAggregateOutputType | null
    _min: ContractorProfileMinAggregateOutputType | null
    _max: ContractorProfileMaxAggregateOutputType | null
  }

  export type ContractorProfileAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
    yearsOfExperience: number | null
  }

  export type ContractorProfileSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
    yearsOfExperience: number | null
  }

  export type ContractorProfileMinAggregateOutputType = {
    id: string | null
    zohoContactId: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    gender: string | null
    city: string | null
    state: string | null
    postalZipCode: string | null
    latitude: number | null
    longitude: number | null
    titleRole: string | null
    yearsOfExperience: number | null
    aboutYou: string | null
    qualificationsAndCertifications: string | null
    languageSpoken: string | null
    hasVehicleAccess: boolean | null
    funFact: string | null
    hobbiesAndInterests: string | null
    whatMakesBusinessUnique: string | null
    additionalInformation: string | null
    profilePicture: string | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type ContractorProfileMaxAggregateOutputType = {
    id: string | null
    zohoContactId: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    gender: string | null
    city: string | null
    state: string | null
    postalZipCode: string | null
    latitude: number | null
    longitude: number | null
    titleRole: string | null
    yearsOfExperience: number | null
    aboutYou: string | null
    qualificationsAndCertifications: string | null
    languageSpoken: string | null
    hasVehicleAccess: boolean | null
    funFact: string | null
    hobbiesAndInterests: string | null
    whatMakesBusinessUnique: string | null
    additionalInformation: string | null
    profilePicture: string | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
  }

  export type ContractorProfileCountAggregateOutputType = {
    id: number
    zohoContactId: number
    firstName: number
    lastName: number
    email: number
    phone: number
    gender: number
    city: number
    state: number
    postalZipCode: number
    latitude: number
    longitude: number
    titleRole: number
    yearsOfExperience: number
    aboutYou: number
    qualificationsAndCertifications: number
    languageSpoken: number
    hasVehicleAccess: number
    funFact: number
    hobbiesAndInterests: number
    whatMakesBusinessUnique: number
    additionalInformation: number
    profilePicture: number
    lastSyncedAt: number
    createdAt: number
    updatedAt: number
    deletedAt: number
    _all: number
  }


  export type ContractorProfileAvgAggregateInputType = {
    latitude?: true
    longitude?: true
    yearsOfExperience?: true
  }

  export type ContractorProfileSumAggregateInputType = {
    latitude?: true
    longitude?: true
    yearsOfExperience?: true
  }

  export type ContractorProfileMinAggregateInputType = {
    id?: true
    zohoContactId?: true
    firstName?: true
    lastName?: true
    email?: true
    phone?: true
    gender?: true
    city?: true
    state?: true
    postalZipCode?: true
    latitude?: true
    longitude?: true
    titleRole?: true
    yearsOfExperience?: true
    aboutYou?: true
    qualificationsAndCertifications?: true
    languageSpoken?: true
    hasVehicleAccess?: true
    funFact?: true
    hobbiesAndInterests?: true
    whatMakesBusinessUnique?: true
    additionalInformation?: true
    profilePicture?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type ContractorProfileMaxAggregateInputType = {
    id?: true
    zohoContactId?: true
    firstName?: true
    lastName?: true
    email?: true
    phone?: true
    gender?: true
    city?: true
    state?: true
    postalZipCode?: true
    latitude?: true
    longitude?: true
    titleRole?: true
    yearsOfExperience?: true
    aboutYou?: true
    qualificationsAndCertifications?: true
    languageSpoken?: true
    hasVehicleAccess?: true
    funFact?: true
    hobbiesAndInterests?: true
    whatMakesBusinessUnique?: true
    additionalInformation?: true
    profilePicture?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
  }

  export type ContractorProfileCountAggregateInputType = {
    id?: true
    zohoContactId?: true
    firstName?: true
    lastName?: true
    email?: true
    phone?: true
    gender?: true
    city?: true
    state?: true
    postalZipCode?: true
    latitude?: true
    longitude?: true
    titleRole?: true
    yearsOfExperience?: true
    aboutYou?: true
    qualificationsAndCertifications?: true
    languageSpoken?: true
    hasVehicleAccess?: true
    funFact?: true
    hobbiesAndInterests?: true
    whatMakesBusinessUnique?: true
    additionalInformation?: true
    profilePicture?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
    deletedAt?: true
    _all?: true
  }

  export type ContractorProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractorProfile to aggregate.
     */
    where?: ContractorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorProfiles to fetch.
     */
    orderBy?: ContractorProfileOrderByWithRelationInput | ContractorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContractorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContractorProfiles
    **/
    _count?: true | ContractorProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ContractorProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ContractorProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContractorProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContractorProfileMaxAggregateInputType
  }

  export type GetContractorProfileAggregateType<T extends ContractorProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateContractorProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContractorProfile[P]>
      : GetScalarType<T[P], AggregateContractorProfile[P]>
  }




  export type ContractorProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContractorProfileWhereInput
    orderBy?: ContractorProfileOrderByWithAggregationInput | ContractorProfileOrderByWithAggregationInput[]
    by: ContractorProfileScalarFieldEnum[] | ContractorProfileScalarFieldEnum
    having?: ContractorProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContractorProfileCountAggregateInputType | true
    _avg?: ContractorProfileAvgAggregateInputType
    _sum?: ContractorProfileSumAggregateInputType
    _min?: ContractorProfileMinAggregateInputType
    _max?: ContractorProfileMaxAggregateInputType
  }

  export type ContractorProfileGroupByOutputType = {
    id: string
    zohoContactId: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    gender: string | null
    city: string | null
    state: string | null
    postalZipCode: string | null
    latitude: number | null
    longitude: number | null
    titleRole: string | null
    yearsOfExperience: number | null
    aboutYou: string | null
    qualificationsAndCertifications: string | null
    languageSpoken: string | null
    hasVehicleAccess: boolean | null
    funFact: string | null
    hobbiesAndInterests: string | null
    whatMakesBusinessUnique: string | null
    additionalInformation: string | null
    profilePicture: string | null
    lastSyncedAt: Date
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    _count: ContractorProfileCountAggregateOutputType | null
    _avg: ContractorProfileAvgAggregateOutputType | null
    _sum: ContractorProfileSumAggregateOutputType | null
    _min: ContractorProfileMinAggregateOutputType | null
    _max: ContractorProfileMaxAggregateOutputType | null
  }

  type GetContractorProfileGroupByPayload<T extends ContractorProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContractorProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContractorProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContractorProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ContractorProfileGroupByOutputType[P]>
        }
      >
    >


  export type ContractorProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoContactId?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
    gender?: boolean
    city?: boolean
    state?: boolean
    postalZipCode?: boolean
    latitude?: boolean
    longitude?: boolean
    titleRole?: boolean
    yearsOfExperience?: boolean
    aboutYou?: boolean
    qualificationsAndCertifications?: boolean
    languageSpoken?: boolean
    hasVehicleAccess?: boolean
    funFact?: boolean
    hobbiesAndInterests?: boolean
    whatMakesBusinessUnique?: boolean
    additionalInformation?: boolean
    profilePicture?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }, ExtArgs["result"]["contractorProfile"]>

  export type ContractorProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoContactId?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
    gender?: boolean
    city?: boolean
    state?: boolean
    postalZipCode?: boolean
    latitude?: boolean
    longitude?: boolean
    titleRole?: boolean
    yearsOfExperience?: boolean
    aboutYou?: boolean
    qualificationsAndCertifications?: boolean
    languageSpoken?: boolean
    hasVehicleAccess?: boolean
    funFact?: boolean
    hobbiesAndInterests?: boolean
    whatMakesBusinessUnique?: boolean
    additionalInformation?: boolean
    profilePicture?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }, ExtArgs["result"]["contractorProfile"]>

  export type ContractorProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoContactId?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
    gender?: boolean
    city?: boolean
    state?: boolean
    postalZipCode?: boolean
    latitude?: boolean
    longitude?: boolean
    titleRole?: boolean
    yearsOfExperience?: boolean
    aboutYou?: boolean
    qualificationsAndCertifications?: boolean
    languageSpoken?: boolean
    hasVehicleAccess?: boolean
    funFact?: boolean
    hobbiesAndInterests?: boolean
    whatMakesBusinessUnique?: boolean
    additionalInformation?: boolean
    profilePicture?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }, ExtArgs["result"]["contractorProfile"]>

  export type ContractorProfileSelectScalar = {
    id?: boolean
    zohoContactId?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phone?: boolean
    gender?: boolean
    city?: boolean
    state?: boolean
    postalZipCode?: boolean
    latitude?: boolean
    longitude?: boolean
    titleRole?: boolean
    yearsOfExperience?: boolean
    aboutYou?: boolean
    qualificationsAndCertifications?: boolean
    languageSpoken?: boolean
    hasVehicleAccess?: boolean
    funFact?: boolean
    hobbiesAndInterests?: boolean
    whatMakesBusinessUnique?: boolean
    additionalInformation?: boolean
    profilePicture?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    deletedAt?: boolean
  }

  export type ContractorProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "zohoContactId" | "firstName" | "lastName" | "email" | "phone" | "gender" | "city" | "state" | "postalZipCode" | "latitude" | "longitude" | "titleRole" | "yearsOfExperience" | "aboutYou" | "qualificationsAndCertifications" | "languageSpoken" | "hasVehicleAccess" | "funFact" | "hobbiesAndInterests" | "whatMakesBusinessUnique" | "additionalInformation" | "profilePicture" | "lastSyncedAt" | "createdAt" | "updatedAt" | "deletedAt", ExtArgs["result"]["contractorProfile"]>

  export type $ContractorProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContractorProfile"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      zohoContactId: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      gender: string | null
      city: string | null
      state: string | null
      postalZipCode: string | null
      latitude: number | null
      longitude: number | null
      titleRole: string | null
      yearsOfExperience: number | null
      aboutYou: string | null
      qualificationsAndCertifications: string | null
      languageSpoken: string | null
      hasVehicleAccess: boolean | null
      funFact: string | null
      hobbiesAndInterests: string | null
      whatMakesBusinessUnique: string | null
      additionalInformation: string | null
      profilePicture: string | null
      lastSyncedAt: Date
      createdAt: Date
      updatedAt: Date
      deletedAt: Date | null
    }, ExtArgs["result"]["contractorProfile"]>
    composites: {}
  }

  type ContractorProfileGetPayload<S extends boolean | null | undefined | ContractorProfileDefaultArgs> = $Result.GetResult<Prisma.$ContractorProfilePayload, S>

  type ContractorProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContractorProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContractorProfileCountAggregateInputType | true
    }

  export interface ContractorProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContractorProfile'], meta: { name: 'ContractorProfile' } }
    /**
     * Find zero or one ContractorProfile that matches the filter.
     * @param {ContractorProfileFindUniqueArgs} args - Arguments to find a ContractorProfile
     * @example
     * // Get one ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContractorProfileFindUniqueArgs>(args: SelectSubset<T, ContractorProfileFindUniqueArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ContractorProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContractorProfileFindUniqueOrThrowArgs} args - Arguments to find a ContractorProfile
     * @example
     * // Get one ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContractorProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, ContractorProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractorProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileFindFirstArgs} args - Arguments to find a ContractorProfile
     * @example
     * // Get one ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContractorProfileFindFirstArgs>(args?: SelectSubset<T, ContractorProfileFindFirstArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractorProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileFindFirstOrThrowArgs} args - Arguments to find a ContractorProfile
     * @example
     * // Get one ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContractorProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, ContractorProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ContractorProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContractorProfiles
     * const contractorProfiles = await prisma.contractorProfile.findMany()
     * 
     * // Get first 10 ContractorProfiles
     * const contractorProfiles = await prisma.contractorProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contractorProfileWithIdOnly = await prisma.contractorProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContractorProfileFindManyArgs>(args?: SelectSubset<T, ContractorProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ContractorProfile.
     * @param {ContractorProfileCreateArgs} args - Arguments to create a ContractorProfile.
     * @example
     * // Create one ContractorProfile
     * const ContractorProfile = await prisma.contractorProfile.create({
     *   data: {
     *     // ... data to create a ContractorProfile
     *   }
     * })
     * 
     */
    create<T extends ContractorProfileCreateArgs>(args: SelectSubset<T, ContractorProfileCreateArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ContractorProfiles.
     * @param {ContractorProfileCreateManyArgs} args - Arguments to create many ContractorProfiles.
     * @example
     * // Create many ContractorProfiles
     * const contractorProfile = await prisma.contractorProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContractorProfileCreateManyArgs>(args?: SelectSubset<T, ContractorProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContractorProfiles and returns the data saved in the database.
     * @param {ContractorProfileCreateManyAndReturnArgs} args - Arguments to create many ContractorProfiles.
     * @example
     * // Create many ContractorProfiles
     * const contractorProfile = await prisma.contractorProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContractorProfiles and only return the `id`
     * const contractorProfileWithIdOnly = await prisma.contractorProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContractorProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, ContractorProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ContractorProfile.
     * @param {ContractorProfileDeleteArgs} args - Arguments to delete one ContractorProfile.
     * @example
     * // Delete one ContractorProfile
     * const ContractorProfile = await prisma.contractorProfile.delete({
     *   where: {
     *     // ... filter to delete one ContractorProfile
     *   }
     * })
     * 
     */
    delete<T extends ContractorProfileDeleteArgs>(args: SelectSubset<T, ContractorProfileDeleteArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ContractorProfile.
     * @param {ContractorProfileUpdateArgs} args - Arguments to update one ContractorProfile.
     * @example
     * // Update one ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContractorProfileUpdateArgs>(args: SelectSubset<T, ContractorProfileUpdateArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ContractorProfiles.
     * @param {ContractorProfileDeleteManyArgs} args - Arguments to filter ContractorProfiles to delete.
     * @example
     * // Delete a few ContractorProfiles
     * const { count } = await prisma.contractorProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContractorProfileDeleteManyArgs>(args?: SelectSubset<T, ContractorProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContractorProfiles
     * const contractorProfile = await prisma.contractorProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContractorProfileUpdateManyArgs>(args: SelectSubset<T, ContractorProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractorProfiles and returns the data updated in the database.
     * @param {ContractorProfileUpdateManyAndReturnArgs} args - Arguments to update many ContractorProfiles.
     * @example
     * // Update many ContractorProfiles
     * const contractorProfile = await prisma.contractorProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ContractorProfiles and only return the `id`
     * const contractorProfileWithIdOnly = await prisma.contractorProfile.updateManyAndReturn({
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
    updateManyAndReturn<T extends ContractorProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, ContractorProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ContractorProfile.
     * @param {ContractorProfileUpsertArgs} args - Arguments to update or create a ContractorProfile.
     * @example
     * // Update or create a ContractorProfile
     * const contractorProfile = await prisma.contractorProfile.upsert({
     *   create: {
     *     // ... data to create a ContractorProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContractorProfile we want to update
     *   }
     * })
     */
    upsert<T extends ContractorProfileUpsertArgs>(args: SelectSubset<T, ContractorProfileUpsertArgs<ExtArgs>>): Prisma__ContractorProfileClient<$Result.GetResult<Prisma.$ContractorProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ContractorProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileCountArgs} args - Arguments to filter ContractorProfiles to count.
     * @example
     * // Count the number of ContractorProfiles
     * const count = await prisma.contractorProfile.count({
     *   where: {
     *     // ... the filter for the ContractorProfiles we want to count
     *   }
     * })
    **/
    count<T extends ContractorProfileCountArgs>(
      args?: Subset<T, ContractorProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContractorProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContractorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContractorProfileAggregateArgs>(args: Subset<T, ContractorProfileAggregateArgs>): Prisma.PrismaPromise<GetContractorProfileAggregateType<T>>

    /**
     * Group by ContractorProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorProfileGroupByArgs} args - Group by arguments.
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
      T extends ContractorProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContractorProfileGroupByArgs['orderBy'] }
        : { orderBy?: ContractorProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ContractorProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContractorProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContractorProfile model
   */
  readonly fields: ContractorProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContractorProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContractorProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ContractorProfile model
   */
  interface ContractorProfileFieldRefs {
    readonly id: FieldRef<"ContractorProfile", 'String'>
    readonly zohoContactId: FieldRef<"ContractorProfile", 'String'>
    readonly firstName: FieldRef<"ContractorProfile", 'String'>
    readonly lastName: FieldRef<"ContractorProfile", 'String'>
    readonly email: FieldRef<"ContractorProfile", 'String'>
    readonly phone: FieldRef<"ContractorProfile", 'String'>
    readonly gender: FieldRef<"ContractorProfile", 'String'>
    readonly city: FieldRef<"ContractorProfile", 'String'>
    readonly state: FieldRef<"ContractorProfile", 'String'>
    readonly postalZipCode: FieldRef<"ContractorProfile", 'String'>
    readonly latitude: FieldRef<"ContractorProfile", 'Float'>
    readonly longitude: FieldRef<"ContractorProfile", 'Float'>
    readonly titleRole: FieldRef<"ContractorProfile", 'String'>
    readonly yearsOfExperience: FieldRef<"ContractorProfile", 'Int'>
    readonly aboutYou: FieldRef<"ContractorProfile", 'String'>
    readonly qualificationsAndCertifications: FieldRef<"ContractorProfile", 'String'>
    readonly languageSpoken: FieldRef<"ContractorProfile", 'String'>
    readonly hasVehicleAccess: FieldRef<"ContractorProfile", 'Boolean'>
    readonly funFact: FieldRef<"ContractorProfile", 'String'>
    readonly hobbiesAndInterests: FieldRef<"ContractorProfile", 'String'>
    readonly whatMakesBusinessUnique: FieldRef<"ContractorProfile", 'String'>
    readonly additionalInformation: FieldRef<"ContractorProfile", 'String'>
    readonly profilePicture: FieldRef<"ContractorProfile", 'String'>
    readonly lastSyncedAt: FieldRef<"ContractorProfile", 'DateTime'>
    readonly createdAt: FieldRef<"ContractorProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"ContractorProfile", 'DateTime'>
    readonly deletedAt: FieldRef<"ContractorProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContractorProfile findUnique
   */
  export type ContractorProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter, which ContractorProfile to fetch.
     */
    where: ContractorProfileWhereUniqueInput
  }

  /**
   * ContractorProfile findUniqueOrThrow
   */
  export type ContractorProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter, which ContractorProfile to fetch.
     */
    where: ContractorProfileWhereUniqueInput
  }

  /**
   * ContractorProfile findFirst
   */
  export type ContractorProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter, which ContractorProfile to fetch.
     */
    where?: ContractorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorProfiles to fetch.
     */
    orderBy?: ContractorProfileOrderByWithRelationInput | ContractorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractorProfiles.
     */
    cursor?: ContractorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractorProfiles.
     */
    distinct?: ContractorProfileScalarFieldEnum | ContractorProfileScalarFieldEnum[]
  }

  /**
   * ContractorProfile findFirstOrThrow
   */
  export type ContractorProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter, which ContractorProfile to fetch.
     */
    where?: ContractorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorProfiles to fetch.
     */
    orderBy?: ContractorProfileOrderByWithRelationInput | ContractorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractorProfiles.
     */
    cursor?: ContractorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractorProfiles.
     */
    distinct?: ContractorProfileScalarFieldEnum | ContractorProfileScalarFieldEnum[]
  }

  /**
   * ContractorProfile findMany
   */
  export type ContractorProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter, which ContractorProfiles to fetch.
     */
    where?: ContractorProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorProfiles to fetch.
     */
    orderBy?: ContractorProfileOrderByWithRelationInput | ContractorProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContractorProfiles.
     */
    cursor?: ContractorProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorProfiles.
     */
    skip?: number
    distinct?: ContractorProfileScalarFieldEnum | ContractorProfileScalarFieldEnum[]
  }

  /**
   * ContractorProfile create
   */
  export type ContractorProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * The data needed to create a ContractorProfile.
     */
    data: XOR<ContractorProfileCreateInput, ContractorProfileUncheckedCreateInput>
  }

  /**
   * ContractorProfile createMany
   */
  export type ContractorProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContractorProfiles.
     */
    data: ContractorProfileCreateManyInput | ContractorProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContractorProfile createManyAndReturn
   */
  export type ContractorProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * The data used to create many ContractorProfiles.
     */
    data: ContractorProfileCreateManyInput | ContractorProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContractorProfile update
   */
  export type ContractorProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * The data needed to update a ContractorProfile.
     */
    data: XOR<ContractorProfileUpdateInput, ContractorProfileUncheckedUpdateInput>
    /**
     * Choose, which ContractorProfile to update.
     */
    where: ContractorProfileWhereUniqueInput
  }

  /**
   * ContractorProfile updateMany
   */
  export type ContractorProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContractorProfiles.
     */
    data: XOR<ContractorProfileUpdateManyMutationInput, ContractorProfileUncheckedUpdateManyInput>
    /**
     * Filter which ContractorProfiles to update
     */
    where?: ContractorProfileWhereInput
    /**
     * Limit how many ContractorProfiles to update.
     */
    limit?: number
  }

  /**
   * ContractorProfile updateManyAndReturn
   */
  export type ContractorProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * The data used to update ContractorProfiles.
     */
    data: XOR<ContractorProfileUpdateManyMutationInput, ContractorProfileUncheckedUpdateManyInput>
    /**
     * Filter which ContractorProfiles to update
     */
    where?: ContractorProfileWhereInput
    /**
     * Limit how many ContractorProfiles to update.
     */
    limit?: number
  }

  /**
   * ContractorProfile upsert
   */
  export type ContractorProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * The filter to search for the ContractorProfile to update in case it exists.
     */
    where: ContractorProfileWhereUniqueInput
    /**
     * In case the ContractorProfile found by the `where` argument doesn't exist, create a new ContractorProfile with this data.
     */
    create: XOR<ContractorProfileCreateInput, ContractorProfileUncheckedCreateInput>
    /**
     * In case the ContractorProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContractorProfileUpdateInput, ContractorProfileUncheckedUpdateInput>
  }

  /**
   * ContractorProfile delete
   */
  export type ContractorProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
    /**
     * Filter which ContractorProfile to delete.
     */
    where: ContractorProfileWhereUniqueInput
  }

  /**
   * ContractorProfile deleteMany
   */
  export type ContractorProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractorProfiles to delete
     */
    where?: ContractorProfileWhereInput
    /**
     * Limit how many ContractorProfiles to delete.
     */
    limit?: number
  }

  /**
   * ContractorProfile without action
   */
  export type ContractorProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorProfile
     */
    select?: ContractorProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorProfile
     */
    omit?: ContractorProfileOmit<ExtArgs> | null
  }


  /**
   * Model ContractorsbyArea
   */

  export type AggregateContractorsbyArea = {
    _count: ContractorsbyAreaCountAggregateOutputType | null
    _min: ContractorsbyAreaMinAggregateOutputType | null
    _max: ContractorsbyAreaMaxAggregateOutputType | null
  }

  export type ContractorsbyAreaMinAggregateOutputType = {
    id: string | null
    workerName: string | null
    suburbState: string | null
    image: string | null
    bio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContractorsbyAreaMaxAggregateOutputType = {
    id: string | null
    workerName: string | null
    suburbState: string | null
    image: string | null
    bio: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContractorsbyAreaCountAggregateOutputType = {
    id: number
    workerName: number
    suburbState: number
    image: number
    bio: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContractorsbyAreaMinAggregateInputType = {
    id?: true
    workerName?: true
    suburbState?: true
    image?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContractorsbyAreaMaxAggregateInputType = {
    id?: true
    workerName?: true
    suburbState?: true
    image?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContractorsbyAreaCountAggregateInputType = {
    id?: true
    workerName?: true
    suburbState?: true
    image?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContractorsbyAreaAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractorsbyArea to aggregate.
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorsbyAreas to fetch.
     */
    orderBy?: ContractorsbyAreaOrderByWithRelationInput | ContractorsbyAreaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContractorsbyAreaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorsbyAreas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorsbyAreas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContractorsbyAreas
    **/
    _count?: true | ContractorsbyAreaCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContractorsbyAreaMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContractorsbyAreaMaxAggregateInputType
  }

  export type GetContractorsbyAreaAggregateType<T extends ContractorsbyAreaAggregateArgs> = {
        [P in keyof T & keyof AggregateContractorsbyArea]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContractorsbyArea[P]>
      : GetScalarType<T[P], AggregateContractorsbyArea[P]>
  }




  export type ContractorsbyAreaGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContractorsbyAreaWhereInput
    orderBy?: ContractorsbyAreaOrderByWithAggregationInput | ContractorsbyAreaOrderByWithAggregationInput[]
    by: ContractorsbyAreaScalarFieldEnum[] | ContractorsbyAreaScalarFieldEnum
    having?: ContractorsbyAreaScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContractorsbyAreaCountAggregateInputType | true
    _min?: ContractorsbyAreaMinAggregateInputType
    _max?: ContractorsbyAreaMaxAggregateInputType
  }

  export type ContractorsbyAreaGroupByOutputType = {
    id: string
    workerName: string
    suburbState: string
    image: string | null
    bio: string | null
    createdAt: Date
    updatedAt: Date
    _count: ContractorsbyAreaCountAggregateOutputType | null
    _min: ContractorsbyAreaMinAggregateOutputType | null
    _max: ContractorsbyAreaMaxAggregateOutputType | null
  }

  type GetContractorsbyAreaGroupByPayload<T extends ContractorsbyAreaGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContractorsbyAreaGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContractorsbyAreaGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContractorsbyAreaGroupByOutputType[P]>
            : GetScalarType<T[P], ContractorsbyAreaGroupByOutputType[P]>
        }
      >
    >


  export type ContractorsbyAreaSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerName?: boolean
    suburbState?: boolean
    image?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contractorsbyArea"]>

  export type ContractorsbyAreaSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerName?: boolean
    suburbState?: boolean
    image?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contractorsbyArea"]>

  export type ContractorsbyAreaSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    workerName?: boolean
    suburbState?: boolean
    image?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["contractorsbyArea"]>

  export type ContractorsbyAreaSelectScalar = {
    id?: boolean
    workerName?: boolean
    suburbState?: boolean
    image?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContractorsbyAreaOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "workerName" | "suburbState" | "image" | "bio" | "createdAt" | "updatedAt", ExtArgs["result"]["contractorsbyArea"]>

  export type $ContractorsbyAreaPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContractorsbyArea"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      workerName: string
      suburbState: string
      image: string | null
      bio: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contractorsbyArea"]>
    composites: {}
  }

  type ContractorsbyAreaGetPayload<S extends boolean | null | undefined | ContractorsbyAreaDefaultArgs> = $Result.GetResult<Prisma.$ContractorsbyAreaPayload, S>

  type ContractorsbyAreaCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContractorsbyAreaFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContractorsbyAreaCountAggregateInputType | true
    }

  export interface ContractorsbyAreaDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContractorsbyArea'], meta: { name: 'ContractorsbyArea' } }
    /**
     * Find zero or one ContractorsbyArea that matches the filter.
     * @param {ContractorsbyAreaFindUniqueArgs} args - Arguments to find a ContractorsbyArea
     * @example
     * // Get one ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContractorsbyAreaFindUniqueArgs>(args: SelectSubset<T, ContractorsbyAreaFindUniqueArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ContractorsbyArea that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContractorsbyAreaFindUniqueOrThrowArgs} args - Arguments to find a ContractorsbyArea
     * @example
     * // Get one ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContractorsbyAreaFindUniqueOrThrowArgs>(args: SelectSubset<T, ContractorsbyAreaFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractorsbyArea that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaFindFirstArgs} args - Arguments to find a ContractorsbyArea
     * @example
     * // Get one ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContractorsbyAreaFindFirstArgs>(args?: SelectSubset<T, ContractorsbyAreaFindFirstArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractorsbyArea that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaFindFirstOrThrowArgs} args - Arguments to find a ContractorsbyArea
     * @example
     * // Get one ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContractorsbyAreaFindFirstOrThrowArgs>(args?: SelectSubset<T, ContractorsbyAreaFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ContractorsbyAreas that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContractorsbyAreas
     * const contractorsbyAreas = await prisma.contractorsbyArea.findMany()
     * 
     * // Get first 10 ContractorsbyAreas
     * const contractorsbyAreas = await prisma.contractorsbyArea.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contractorsbyAreaWithIdOnly = await prisma.contractorsbyArea.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContractorsbyAreaFindManyArgs>(args?: SelectSubset<T, ContractorsbyAreaFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ContractorsbyArea.
     * @param {ContractorsbyAreaCreateArgs} args - Arguments to create a ContractorsbyArea.
     * @example
     * // Create one ContractorsbyArea
     * const ContractorsbyArea = await prisma.contractorsbyArea.create({
     *   data: {
     *     // ... data to create a ContractorsbyArea
     *   }
     * })
     * 
     */
    create<T extends ContractorsbyAreaCreateArgs>(args: SelectSubset<T, ContractorsbyAreaCreateArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ContractorsbyAreas.
     * @param {ContractorsbyAreaCreateManyArgs} args - Arguments to create many ContractorsbyAreas.
     * @example
     * // Create many ContractorsbyAreas
     * const contractorsbyArea = await prisma.contractorsbyArea.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContractorsbyAreaCreateManyArgs>(args?: SelectSubset<T, ContractorsbyAreaCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContractorsbyAreas and returns the data saved in the database.
     * @param {ContractorsbyAreaCreateManyAndReturnArgs} args - Arguments to create many ContractorsbyAreas.
     * @example
     * // Create many ContractorsbyAreas
     * const contractorsbyArea = await prisma.contractorsbyArea.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContractorsbyAreas and only return the `id`
     * const contractorsbyAreaWithIdOnly = await prisma.contractorsbyArea.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContractorsbyAreaCreateManyAndReturnArgs>(args?: SelectSubset<T, ContractorsbyAreaCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ContractorsbyArea.
     * @param {ContractorsbyAreaDeleteArgs} args - Arguments to delete one ContractorsbyArea.
     * @example
     * // Delete one ContractorsbyArea
     * const ContractorsbyArea = await prisma.contractorsbyArea.delete({
     *   where: {
     *     // ... filter to delete one ContractorsbyArea
     *   }
     * })
     * 
     */
    delete<T extends ContractorsbyAreaDeleteArgs>(args: SelectSubset<T, ContractorsbyAreaDeleteArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ContractorsbyArea.
     * @param {ContractorsbyAreaUpdateArgs} args - Arguments to update one ContractorsbyArea.
     * @example
     * // Update one ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContractorsbyAreaUpdateArgs>(args: SelectSubset<T, ContractorsbyAreaUpdateArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ContractorsbyAreas.
     * @param {ContractorsbyAreaDeleteManyArgs} args - Arguments to filter ContractorsbyAreas to delete.
     * @example
     * // Delete a few ContractorsbyAreas
     * const { count } = await prisma.contractorsbyArea.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContractorsbyAreaDeleteManyArgs>(args?: SelectSubset<T, ContractorsbyAreaDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractorsbyAreas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContractorsbyAreas
     * const contractorsbyArea = await prisma.contractorsbyArea.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContractorsbyAreaUpdateManyArgs>(args: SelectSubset<T, ContractorsbyAreaUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractorsbyAreas and returns the data updated in the database.
     * @param {ContractorsbyAreaUpdateManyAndReturnArgs} args - Arguments to update many ContractorsbyAreas.
     * @example
     * // Update many ContractorsbyAreas
     * const contractorsbyArea = await prisma.contractorsbyArea.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ContractorsbyAreas and only return the `id`
     * const contractorsbyAreaWithIdOnly = await prisma.contractorsbyArea.updateManyAndReturn({
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
    updateManyAndReturn<T extends ContractorsbyAreaUpdateManyAndReturnArgs>(args: SelectSubset<T, ContractorsbyAreaUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ContractorsbyArea.
     * @param {ContractorsbyAreaUpsertArgs} args - Arguments to update or create a ContractorsbyArea.
     * @example
     * // Update or create a ContractorsbyArea
     * const contractorsbyArea = await prisma.contractorsbyArea.upsert({
     *   create: {
     *     // ... data to create a ContractorsbyArea
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContractorsbyArea we want to update
     *   }
     * })
     */
    upsert<T extends ContractorsbyAreaUpsertArgs>(args: SelectSubset<T, ContractorsbyAreaUpsertArgs<ExtArgs>>): Prisma__ContractorsbyAreaClient<$Result.GetResult<Prisma.$ContractorsbyAreaPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ContractorsbyAreas.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaCountArgs} args - Arguments to filter ContractorsbyAreas to count.
     * @example
     * // Count the number of ContractorsbyAreas
     * const count = await prisma.contractorsbyArea.count({
     *   where: {
     *     // ... the filter for the ContractorsbyAreas we want to count
     *   }
     * })
    **/
    count<T extends ContractorsbyAreaCountArgs>(
      args?: Subset<T, ContractorsbyAreaCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContractorsbyAreaCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContractorsbyArea.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContractorsbyAreaAggregateArgs>(args: Subset<T, ContractorsbyAreaAggregateArgs>): Prisma.PrismaPromise<GetContractorsbyAreaAggregateType<T>>

    /**
     * Group by ContractorsbyArea.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractorsbyAreaGroupByArgs} args - Group by arguments.
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
      T extends ContractorsbyAreaGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContractorsbyAreaGroupByArgs['orderBy'] }
        : { orderBy?: ContractorsbyAreaGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ContractorsbyAreaGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContractorsbyAreaGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContractorsbyArea model
   */
  readonly fields: ContractorsbyAreaFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContractorsbyArea.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContractorsbyAreaClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ContractorsbyArea model
   */
  interface ContractorsbyAreaFieldRefs {
    readonly id: FieldRef<"ContractorsbyArea", 'String'>
    readonly workerName: FieldRef<"ContractorsbyArea", 'String'>
    readonly suburbState: FieldRef<"ContractorsbyArea", 'String'>
    readonly image: FieldRef<"ContractorsbyArea", 'String'>
    readonly bio: FieldRef<"ContractorsbyArea", 'String'>
    readonly createdAt: FieldRef<"ContractorsbyArea", 'DateTime'>
    readonly updatedAt: FieldRef<"ContractorsbyArea", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContractorsbyArea findUnique
   */
  export type ContractorsbyAreaFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter, which ContractorsbyArea to fetch.
     */
    where: ContractorsbyAreaWhereUniqueInput
  }

  /**
   * ContractorsbyArea findUniqueOrThrow
   */
  export type ContractorsbyAreaFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter, which ContractorsbyArea to fetch.
     */
    where: ContractorsbyAreaWhereUniqueInput
  }

  /**
   * ContractorsbyArea findFirst
   */
  export type ContractorsbyAreaFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter, which ContractorsbyArea to fetch.
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorsbyAreas to fetch.
     */
    orderBy?: ContractorsbyAreaOrderByWithRelationInput | ContractorsbyAreaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractorsbyAreas.
     */
    cursor?: ContractorsbyAreaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorsbyAreas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorsbyAreas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractorsbyAreas.
     */
    distinct?: ContractorsbyAreaScalarFieldEnum | ContractorsbyAreaScalarFieldEnum[]
  }

  /**
   * ContractorsbyArea findFirstOrThrow
   */
  export type ContractorsbyAreaFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter, which ContractorsbyArea to fetch.
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorsbyAreas to fetch.
     */
    orderBy?: ContractorsbyAreaOrderByWithRelationInput | ContractorsbyAreaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractorsbyAreas.
     */
    cursor?: ContractorsbyAreaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorsbyAreas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorsbyAreas.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractorsbyAreas.
     */
    distinct?: ContractorsbyAreaScalarFieldEnum | ContractorsbyAreaScalarFieldEnum[]
  }

  /**
   * ContractorsbyArea findMany
   */
  export type ContractorsbyAreaFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter, which ContractorsbyAreas to fetch.
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractorsbyAreas to fetch.
     */
    orderBy?: ContractorsbyAreaOrderByWithRelationInput | ContractorsbyAreaOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContractorsbyAreas.
     */
    cursor?: ContractorsbyAreaWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractorsbyAreas from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractorsbyAreas.
     */
    skip?: number
    distinct?: ContractorsbyAreaScalarFieldEnum | ContractorsbyAreaScalarFieldEnum[]
  }

  /**
   * ContractorsbyArea create
   */
  export type ContractorsbyAreaCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * The data needed to create a ContractorsbyArea.
     */
    data: XOR<ContractorsbyAreaCreateInput, ContractorsbyAreaUncheckedCreateInput>
  }

  /**
   * ContractorsbyArea createMany
   */
  export type ContractorsbyAreaCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContractorsbyAreas.
     */
    data: ContractorsbyAreaCreateManyInput | ContractorsbyAreaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContractorsbyArea createManyAndReturn
   */
  export type ContractorsbyAreaCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * The data used to create many ContractorsbyAreas.
     */
    data: ContractorsbyAreaCreateManyInput | ContractorsbyAreaCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ContractorsbyArea update
   */
  export type ContractorsbyAreaUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * The data needed to update a ContractorsbyArea.
     */
    data: XOR<ContractorsbyAreaUpdateInput, ContractorsbyAreaUncheckedUpdateInput>
    /**
     * Choose, which ContractorsbyArea to update.
     */
    where: ContractorsbyAreaWhereUniqueInput
  }

  /**
   * ContractorsbyArea updateMany
   */
  export type ContractorsbyAreaUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContractorsbyAreas.
     */
    data: XOR<ContractorsbyAreaUpdateManyMutationInput, ContractorsbyAreaUncheckedUpdateManyInput>
    /**
     * Filter which ContractorsbyAreas to update
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * Limit how many ContractorsbyAreas to update.
     */
    limit?: number
  }

  /**
   * ContractorsbyArea updateManyAndReturn
   */
  export type ContractorsbyAreaUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * The data used to update ContractorsbyAreas.
     */
    data: XOR<ContractorsbyAreaUpdateManyMutationInput, ContractorsbyAreaUncheckedUpdateManyInput>
    /**
     * Filter which ContractorsbyAreas to update
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * Limit how many ContractorsbyAreas to update.
     */
    limit?: number
  }

  /**
   * ContractorsbyArea upsert
   */
  export type ContractorsbyAreaUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * The filter to search for the ContractorsbyArea to update in case it exists.
     */
    where: ContractorsbyAreaWhereUniqueInput
    /**
     * In case the ContractorsbyArea found by the `where` argument doesn't exist, create a new ContractorsbyArea with this data.
     */
    create: XOR<ContractorsbyAreaCreateInput, ContractorsbyAreaUncheckedCreateInput>
    /**
     * In case the ContractorsbyArea was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContractorsbyAreaUpdateInput, ContractorsbyAreaUncheckedUpdateInput>
  }

  /**
   * ContractorsbyArea delete
   */
  export type ContractorsbyAreaDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
    /**
     * Filter which ContractorsbyArea to delete.
     */
    where: ContractorsbyAreaWhereUniqueInput
  }

  /**
   * ContractorsbyArea deleteMany
   */
  export type ContractorsbyAreaDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractorsbyAreas to delete
     */
    where?: ContractorsbyAreaWhereInput
    /**
     * Limit how many ContractorsbyAreas to delete.
     */
    limit?: number
  }

  /**
   * ContractorsbyArea without action
   */
  export type ContractorsbyAreaDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractorsbyArea
     */
    select?: ContractorsbyAreaSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractorsbyArea
     */
    omit?: ContractorsbyAreaOmit<ExtArgs> | null
  }


  /**
   * Model Job
   */

  export type AggregateJob = {
    _count: JobCountAggregateOutputType | null
    _min: JobMinAggregateOutputType | null
    _max: JobMaxAggregateOutputType | null
  }

  export type JobMinAggregateOutputType = {
    id: string | null
    zohoId: string | null
    dealName: string | null
    title: string | null
    description: string | null
    stage: string | null
    suburbs: string | null
    state: string | null
    serviceAvailed: string | null
    serviceRequirements: string | null
    disabilities: string | null
    behaviouralConcerns: string | null
    culturalConsiderations: string | null
    language: string | null
    religion: string | null
    age: string | null
    gender: string | null
    hobbies: string | null
    clientName: string | null
    clientZohoId: string | null
    relationshipToParticipant: string | null
    ownerName: string | null
    ownerEmail: string | null
    ownerZohoId: string | null
    postedAt: Date | null
    active: boolean | null
    requiredMoreWorker: boolean | null
    anotherContractorNeeded: boolean | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobMaxAggregateOutputType = {
    id: string | null
    zohoId: string | null
    dealName: string | null
    title: string | null
    description: string | null
    stage: string | null
    suburbs: string | null
    state: string | null
    serviceAvailed: string | null
    serviceRequirements: string | null
    disabilities: string | null
    behaviouralConcerns: string | null
    culturalConsiderations: string | null
    language: string | null
    religion: string | null
    age: string | null
    gender: string | null
    hobbies: string | null
    clientName: string | null
    clientZohoId: string | null
    relationshipToParticipant: string | null
    ownerName: string | null
    ownerEmail: string | null
    ownerZohoId: string | null
    postedAt: Date | null
    active: boolean | null
    requiredMoreWorker: boolean | null
    anotherContractorNeeded: boolean | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type JobCountAggregateOutputType = {
    id: number
    zohoId: number
    dealName: number
    title: number
    description: number
    stage: number
    suburbs: number
    state: number
    serviceAvailed: number
    serviceRequirements: number
    disabilities: number
    behaviouralConcerns: number
    culturalConsiderations: number
    language: number
    religion: number
    age: number
    gender: number
    hobbies: number
    clientName: number
    clientZohoId: number
    relationshipToParticipant: number
    ownerName: number
    ownerEmail: number
    ownerZohoId: number
    postedAt: number
    active: number
    requiredMoreWorker: number
    anotherContractorNeeded: number
    lastSyncedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type JobMinAggregateInputType = {
    id?: true
    zohoId?: true
    dealName?: true
    title?: true
    description?: true
    stage?: true
    suburbs?: true
    state?: true
    serviceAvailed?: true
    serviceRequirements?: true
    disabilities?: true
    behaviouralConcerns?: true
    culturalConsiderations?: true
    language?: true
    religion?: true
    age?: true
    gender?: true
    hobbies?: true
    clientName?: true
    clientZohoId?: true
    relationshipToParticipant?: true
    ownerName?: true
    ownerEmail?: true
    ownerZohoId?: true
    postedAt?: true
    active?: true
    requiredMoreWorker?: true
    anotherContractorNeeded?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobMaxAggregateInputType = {
    id?: true
    zohoId?: true
    dealName?: true
    title?: true
    description?: true
    stage?: true
    suburbs?: true
    state?: true
    serviceAvailed?: true
    serviceRequirements?: true
    disabilities?: true
    behaviouralConcerns?: true
    culturalConsiderations?: true
    language?: true
    religion?: true
    age?: true
    gender?: true
    hobbies?: true
    clientName?: true
    clientZohoId?: true
    relationshipToParticipant?: true
    ownerName?: true
    ownerEmail?: true
    ownerZohoId?: true
    postedAt?: true
    active?: true
    requiredMoreWorker?: true
    anotherContractorNeeded?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type JobCountAggregateInputType = {
    id?: true
    zohoId?: true
    dealName?: true
    title?: true
    description?: true
    stage?: true
    suburbs?: true
    state?: true
    serviceAvailed?: true
    serviceRequirements?: true
    disabilities?: true
    behaviouralConcerns?: true
    culturalConsiderations?: true
    language?: true
    religion?: true
    age?: true
    gender?: true
    hobbies?: true
    clientName?: true
    clientZohoId?: true
    relationshipToParticipant?: true
    ownerName?: true
    ownerEmail?: true
    ownerZohoId?: true
    postedAt?: true
    active?: true
    requiredMoreWorker?: true
    anotherContractorNeeded?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type JobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Job to aggregate.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Jobs
    **/
    _count?: true | JobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: JobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: JobMaxAggregateInputType
  }

  export type GetJobAggregateType<T extends JobAggregateArgs> = {
        [P in keyof T & keyof AggregateJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateJob[P]>
      : GetScalarType<T[P], AggregateJob[P]>
  }




  export type JobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: JobWhereInput
    orderBy?: JobOrderByWithAggregationInput | JobOrderByWithAggregationInput[]
    by: JobScalarFieldEnum[] | JobScalarFieldEnum
    having?: JobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: JobCountAggregateInputType | true
    _min?: JobMinAggregateInputType
    _max?: JobMaxAggregateInputType
  }

  export type JobGroupByOutputType = {
    id: string
    zohoId: string
    dealName: string
    title: string | null
    description: string | null
    stage: string
    suburbs: string | null
    state: string | null
    serviceAvailed: string | null
    serviceRequirements: string | null
    disabilities: string | null
    behaviouralConcerns: string | null
    culturalConsiderations: string | null
    language: string | null
    religion: string | null
    age: string | null
    gender: string | null
    hobbies: string | null
    clientName: string | null
    clientZohoId: string | null
    relationshipToParticipant: string | null
    ownerName: string | null
    ownerEmail: string | null
    ownerZohoId: string | null
    postedAt: Date | null
    active: boolean
    requiredMoreWorker: boolean | null
    anotherContractorNeeded: boolean | null
    lastSyncedAt: Date
    createdAt: Date
    updatedAt: Date
    _count: JobCountAggregateOutputType | null
    _min: JobMinAggregateOutputType | null
    _max: JobMaxAggregateOutputType | null
  }

  type GetJobGroupByPayload<T extends JobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<JobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof JobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], JobGroupByOutputType[P]>
            : GetScalarType<T[P], JobGroupByOutputType[P]>
        }
      >
    >


  export type JobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoId?: boolean
    dealName?: boolean
    title?: boolean
    description?: boolean
    stage?: boolean
    suburbs?: boolean
    state?: boolean
    serviceAvailed?: boolean
    serviceRequirements?: boolean
    disabilities?: boolean
    behaviouralConcerns?: boolean
    culturalConsiderations?: boolean
    language?: boolean
    religion?: boolean
    age?: boolean
    gender?: boolean
    hobbies?: boolean
    clientName?: boolean
    clientZohoId?: boolean
    relationshipToParticipant?: boolean
    ownerName?: boolean
    ownerEmail?: boolean
    ownerZohoId?: boolean
    postedAt?: boolean
    active?: boolean
    requiredMoreWorker?: boolean
    anotherContractorNeeded?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["job"]>

  export type JobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoId?: boolean
    dealName?: boolean
    title?: boolean
    description?: boolean
    stage?: boolean
    suburbs?: boolean
    state?: boolean
    serviceAvailed?: boolean
    serviceRequirements?: boolean
    disabilities?: boolean
    behaviouralConcerns?: boolean
    culturalConsiderations?: boolean
    language?: boolean
    religion?: boolean
    age?: boolean
    gender?: boolean
    hobbies?: boolean
    clientName?: boolean
    clientZohoId?: boolean
    relationshipToParticipant?: boolean
    ownerName?: boolean
    ownerEmail?: boolean
    ownerZohoId?: boolean
    postedAt?: boolean
    active?: boolean
    requiredMoreWorker?: boolean
    anotherContractorNeeded?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["job"]>

  export type JobSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    zohoId?: boolean
    dealName?: boolean
    title?: boolean
    description?: boolean
    stage?: boolean
    suburbs?: boolean
    state?: boolean
    serviceAvailed?: boolean
    serviceRequirements?: boolean
    disabilities?: boolean
    behaviouralConcerns?: boolean
    culturalConsiderations?: boolean
    language?: boolean
    religion?: boolean
    age?: boolean
    gender?: boolean
    hobbies?: boolean
    clientName?: boolean
    clientZohoId?: boolean
    relationshipToParticipant?: boolean
    ownerName?: boolean
    ownerEmail?: boolean
    ownerZohoId?: boolean
    postedAt?: boolean
    active?: boolean
    requiredMoreWorker?: boolean
    anotherContractorNeeded?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["job"]>

  export type JobSelectScalar = {
    id?: boolean
    zohoId?: boolean
    dealName?: boolean
    title?: boolean
    description?: boolean
    stage?: boolean
    suburbs?: boolean
    state?: boolean
    serviceAvailed?: boolean
    serviceRequirements?: boolean
    disabilities?: boolean
    behaviouralConcerns?: boolean
    culturalConsiderations?: boolean
    language?: boolean
    religion?: boolean
    age?: boolean
    gender?: boolean
    hobbies?: boolean
    clientName?: boolean
    clientZohoId?: boolean
    relationshipToParticipant?: boolean
    ownerName?: boolean
    ownerEmail?: boolean
    ownerZohoId?: boolean
    postedAt?: boolean
    active?: boolean
    requiredMoreWorker?: boolean
    anotherContractorNeeded?: boolean
    lastSyncedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type JobOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "zohoId" | "dealName" | "title" | "description" | "stage" | "suburbs" | "state" | "serviceAvailed" | "serviceRequirements" | "disabilities" | "behaviouralConcerns" | "culturalConsiderations" | "language" | "religion" | "age" | "gender" | "hobbies" | "clientName" | "clientZohoId" | "relationshipToParticipant" | "ownerName" | "ownerEmail" | "ownerZohoId" | "postedAt" | "active" | "requiredMoreWorker" | "anotherContractorNeeded" | "lastSyncedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["job"]>

  export type $JobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Job"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      zohoId: string
      dealName: string
      title: string | null
      description: string | null
      stage: string
      suburbs: string | null
      state: string | null
      serviceAvailed: string | null
      serviceRequirements: string | null
      disabilities: string | null
      behaviouralConcerns: string | null
      culturalConsiderations: string | null
      language: string | null
      religion: string | null
      age: string | null
      gender: string | null
      hobbies: string | null
      clientName: string | null
      clientZohoId: string | null
      relationshipToParticipant: string | null
      ownerName: string | null
      ownerEmail: string | null
      ownerZohoId: string | null
      postedAt: Date | null
      active: boolean
      requiredMoreWorker: boolean | null
      anotherContractorNeeded: boolean | null
      lastSyncedAt: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["job"]>
    composites: {}
  }

  type JobGetPayload<S extends boolean | null | undefined | JobDefaultArgs> = $Result.GetResult<Prisma.$JobPayload, S>

  type JobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<JobFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: JobCountAggregateInputType | true
    }

  export interface JobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Job'], meta: { name: 'Job' } }
    /**
     * Find zero or one Job that matches the filter.
     * @param {JobFindUniqueArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends JobFindUniqueArgs>(args: SelectSubset<T, JobFindUniqueArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Job that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {JobFindUniqueOrThrowArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends JobFindUniqueOrThrowArgs>(args: SelectSubset<T, JobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Job that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindFirstArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends JobFindFirstArgs>(args?: SelectSubset<T, JobFindFirstArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Job that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindFirstOrThrowArgs} args - Arguments to find a Job
     * @example
     * // Get one Job
     * const job = await prisma.job.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends JobFindFirstOrThrowArgs>(args?: SelectSubset<T, JobFindFirstOrThrowArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Jobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Jobs
     * const jobs = await prisma.job.findMany()
     * 
     * // Get first 10 Jobs
     * const jobs = await prisma.job.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const jobWithIdOnly = await prisma.job.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends JobFindManyArgs>(args?: SelectSubset<T, JobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Job.
     * @param {JobCreateArgs} args - Arguments to create a Job.
     * @example
     * // Create one Job
     * const Job = await prisma.job.create({
     *   data: {
     *     // ... data to create a Job
     *   }
     * })
     * 
     */
    create<T extends JobCreateArgs>(args: SelectSubset<T, JobCreateArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Jobs.
     * @param {JobCreateManyArgs} args - Arguments to create many Jobs.
     * @example
     * // Create many Jobs
     * const job = await prisma.job.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends JobCreateManyArgs>(args?: SelectSubset<T, JobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Jobs and returns the data saved in the database.
     * @param {JobCreateManyAndReturnArgs} args - Arguments to create many Jobs.
     * @example
     * // Create many Jobs
     * const job = await prisma.job.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Jobs and only return the `id`
     * const jobWithIdOnly = await prisma.job.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends JobCreateManyAndReturnArgs>(args?: SelectSubset<T, JobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Job.
     * @param {JobDeleteArgs} args - Arguments to delete one Job.
     * @example
     * // Delete one Job
     * const Job = await prisma.job.delete({
     *   where: {
     *     // ... filter to delete one Job
     *   }
     * })
     * 
     */
    delete<T extends JobDeleteArgs>(args: SelectSubset<T, JobDeleteArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Job.
     * @param {JobUpdateArgs} args - Arguments to update one Job.
     * @example
     * // Update one Job
     * const job = await prisma.job.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends JobUpdateArgs>(args: SelectSubset<T, JobUpdateArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Jobs.
     * @param {JobDeleteManyArgs} args - Arguments to filter Jobs to delete.
     * @example
     * // Delete a few Jobs
     * const { count } = await prisma.job.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends JobDeleteManyArgs>(args?: SelectSubset<T, JobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Jobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Jobs
     * const job = await prisma.job.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends JobUpdateManyArgs>(args: SelectSubset<T, JobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Jobs and returns the data updated in the database.
     * @param {JobUpdateManyAndReturnArgs} args - Arguments to update many Jobs.
     * @example
     * // Update many Jobs
     * const job = await prisma.job.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Jobs and only return the `id`
     * const jobWithIdOnly = await prisma.job.updateManyAndReturn({
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
    updateManyAndReturn<T extends JobUpdateManyAndReturnArgs>(args: SelectSubset<T, JobUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Job.
     * @param {JobUpsertArgs} args - Arguments to update or create a Job.
     * @example
     * // Update or create a Job
     * const job = await prisma.job.upsert({
     *   create: {
     *     // ... data to create a Job
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Job we want to update
     *   }
     * })
     */
    upsert<T extends JobUpsertArgs>(args: SelectSubset<T, JobUpsertArgs<ExtArgs>>): Prisma__JobClient<$Result.GetResult<Prisma.$JobPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Jobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobCountArgs} args - Arguments to filter Jobs to count.
     * @example
     * // Count the number of Jobs
     * const count = await prisma.job.count({
     *   where: {
     *     // ... the filter for the Jobs we want to count
     *   }
     * })
    **/
    count<T extends JobCountArgs>(
      args?: Subset<T, JobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], JobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Job.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends JobAggregateArgs>(args: Subset<T, JobAggregateArgs>): Prisma.PrismaPromise<GetJobAggregateType<T>>

    /**
     * Group by Job.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {JobGroupByArgs} args - Group by arguments.
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
      T extends JobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: JobGroupByArgs['orderBy'] }
        : { orderBy?: JobGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, JobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Job model
   */
  readonly fields: JobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Job.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__JobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Job model
   */
  interface JobFieldRefs {
    readonly id: FieldRef<"Job", 'String'>
    readonly zohoId: FieldRef<"Job", 'String'>
    readonly dealName: FieldRef<"Job", 'String'>
    readonly title: FieldRef<"Job", 'String'>
    readonly description: FieldRef<"Job", 'String'>
    readonly stage: FieldRef<"Job", 'String'>
    readonly suburbs: FieldRef<"Job", 'String'>
    readonly state: FieldRef<"Job", 'String'>
    readonly serviceAvailed: FieldRef<"Job", 'String'>
    readonly serviceRequirements: FieldRef<"Job", 'String'>
    readonly disabilities: FieldRef<"Job", 'String'>
    readonly behaviouralConcerns: FieldRef<"Job", 'String'>
    readonly culturalConsiderations: FieldRef<"Job", 'String'>
    readonly language: FieldRef<"Job", 'String'>
    readonly religion: FieldRef<"Job", 'String'>
    readonly age: FieldRef<"Job", 'String'>
    readonly gender: FieldRef<"Job", 'String'>
    readonly hobbies: FieldRef<"Job", 'String'>
    readonly clientName: FieldRef<"Job", 'String'>
    readonly clientZohoId: FieldRef<"Job", 'String'>
    readonly relationshipToParticipant: FieldRef<"Job", 'String'>
    readonly ownerName: FieldRef<"Job", 'String'>
    readonly ownerEmail: FieldRef<"Job", 'String'>
    readonly ownerZohoId: FieldRef<"Job", 'String'>
    readonly postedAt: FieldRef<"Job", 'DateTime'>
    readonly active: FieldRef<"Job", 'Boolean'>
    readonly requiredMoreWorker: FieldRef<"Job", 'Boolean'>
    readonly anotherContractorNeeded: FieldRef<"Job", 'Boolean'>
    readonly lastSyncedAt: FieldRef<"Job", 'DateTime'>
    readonly createdAt: FieldRef<"Job", 'DateTime'>
    readonly updatedAt: FieldRef<"Job", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Job findUnique
   */
  export type JobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job findUniqueOrThrow
   */
  export type JobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job findFirst
   */
  export type JobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Jobs.
     */
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job findFirstOrThrow
   */
  export type JobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter, which Job to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Jobs.
     */
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job findMany
   */
  export type JobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter, which Jobs to fetch.
     */
    where?: JobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Jobs to fetch.
     */
    orderBy?: JobOrderByWithRelationInput | JobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Jobs.
     */
    cursor?: JobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Jobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Jobs.
     */
    skip?: number
    distinct?: JobScalarFieldEnum | JobScalarFieldEnum[]
  }

  /**
   * Job create
   */
  export type JobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * The data needed to create a Job.
     */
    data: XOR<JobCreateInput, JobUncheckedCreateInput>
  }

  /**
   * Job createMany
   */
  export type JobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Jobs.
     */
    data: JobCreateManyInput | JobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Job createManyAndReturn
   */
  export type JobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * The data used to create many Jobs.
     */
    data: JobCreateManyInput | JobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Job update
   */
  export type JobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * The data needed to update a Job.
     */
    data: XOR<JobUpdateInput, JobUncheckedUpdateInput>
    /**
     * Choose, which Job to update.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job updateMany
   */
  export type JobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Jobs.
     */
    data: XOR<JobUpdateManyMutationInput, JobUncheckedUpdateManyInput>
    /**
     * Filter which Jobs to update
     */
    where?: JobWhereInput
    /**
     * Limit how many Jobs to update.
     */
    limit?: number
  }

  /**
   * Job updateManyAndReturn
   */
  export type JobUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * The data used to update Jobs.
     */
    data: XOR<JobUpdateManyMutationInput, JobUncheckedUpdateManyInput>
    /**
     * Filter which Jobs to update
     */
    where?: JobWhereInput
    /**
     * Limit how many Jobs to update.
     */
    limit?: number
  }

  /**
   * Job upsert
   */
  export type JobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * The filter to search for the Job to update in case it exists.
     */
    where: JobWhereUniqueInput
    /**
     * In case the Job found by the `where` argument doesn't exist, create a new Job with this data.
     */
    create: XOR<JobCreateInput, JobUncheckedCreateInput>
    /**
     * In case the Job was found with the provided `where` argument, update it with this data.
     */
    update: XOR<JobUpdateInput, JobUncheckedUpdateInput>
  }

  /**
   * Job delete
   */
  export type JobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
    /**
     * Filter which Job to delete.
     */
    where: JobWhereUniqueInput
  }

  /**
   * Job deleteMany
   */
  export type JobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Jobs to delete
     */
    where?: JobWhereInput
    /**
     * Limit how many Jobs to delete.
     */
    limit?: number
  }

  /**
   * Job without action
   */
  export type JobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Job
     */
    select?: JobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Job
     */
    omit?: JobOmit<ExtArgs> | null
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


  export const ContractorProfileScalarFieldEnum: {
    id: 'id',
    zohoContactId: 'zohoContactId',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    gender: 'gender',
    city: 'city',
    state: 'state',
    postalZipCode: 'postalZipCode',
    latitude: 'latitude',
    longitude: 'longitude',
    titleRole: 'titleRole',
    yearsOfExperience: 'yearsOfExperience',
    aboutYou: 'aboutYou',
    qualificationsAndCertifications: 'qualificationsAndCertifications',
    languageSpoken: 'languageSpoken',
    hasVehicleAccess: 'hasVehicleAccess',
    funFact: 'funFact',
    hobbiesAndInterests: 'hobbiesAndInterests',
    whatMakesBusinessUnique: 'whatMakesBusinessUnique',
    additionalInformation: 'additionalInformation',
    profilePicture: 'profilePicture',
    lastSyncedAt: 'lastSyncedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt'
  };

  export type ContractorProfileScalarFieldEnum = (typeof ContractorProfileScalarFieldEnum)[keyof typeof ContractorProfileScalarFieldEnum]


  export const ContractorsbyAreaScalarFieldEnum: {
    id: 'id',
    workerName: 'workerName',
    suburbState: 'suburbState',
    image: 'image',
    bio: 'bio',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContractorsbyAreaScalarFieldEnum = (typeof ContractorsbyAreaScalarFieldEnum)[keyof typeof ContractorsbyAreaScalarFieldEnum]


  export const JobScalarFieldEnum: {
    id: 'id',
    zohoId: 'zohoId',
    dealName: 'dealName',
    title: 'title',
    description: 'description',
    stage: 'stage',
    suburbs: 'suburbs',
    state: 'state',
    serviceAvailed: 'serviceAvailed',
    serviceRequirements: 'serviceRequirements',
    disabilities: 'disabilities',
    behaviouralConcerns: 'behaviouralConcerns',
    culturalConsiderations: 'culturalConsiderations',
    language: 'language',
    religion: 'religion',
    age: 'age',
    gender: 'gender',
    hobbies: 'hobbies',
    clientName: 'clientName',
    clientZohoId: 'clientZohoId',
    relationshipToParticipant: 'relationshipToParticipant',
    ownerName: 'ownerName',
    ownerEmail: 'ownerEmail',
    ownerZohoId: 'ownerZohoId',
    postedAt: 'postedAt',
    active: 'active',
    requiredMoreWorker: 'requiredMoreWorker',
    anotherContractorNeeded: 'anotherContractorNeeded',
    lastSyncedAt: 'lastSyncedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type JobScalarFieldEnum = (typeof JobScalarFieldEnum)[keyof typeof JobScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    
  /**
   * Deep Input Types
   */


  export type ContractorProfileWhereInput = {
    AND?: ContractorProfileWhereInput | ContractorProfileWhereInput[]
    OR?: ContractorProfileWhereInput[]
    NOT?: ContractorProfileWhereInput | ContractorProfileWhereInput[]
    id?: StringFilter<"ContractorProfile"> | string
    zohoContactId?: StringFilter<"ContractorProfile"> | string
    firstName?: StringFilter<"ContractorProfile"> | string
    lastName?: StringFilter<"ContractorProfile"> | string
    email?: StringFilter<"ContractorProfile"> | string
    phone?: StringNullableFilter<"ContractorProfile"> | string | null
    gender?: StringNullableFilter<"ContractorProfile"> | string | null
    city?: StringNullableFilter<"ContractorProfile"> | string | null
    state?: StringNullableFilter<"ContractorProfile"> | string | null
    postalZipCode?: StringNullableFilter<"ContractorProfile"> | string | null
    latitude?: FloatNullableFilter<"ContractorProfile"> | number | null
    longitude?: FloatNullableFilter<"ContractorProfile"> | number | null
    titleRole?: StringNullableFilter<"ContractorProfile"> | string | null
    yearsOfExperience?: IntNullableFilter<"ContractorProfile"> | number | null
    aboutYou?: StringNullableFilter<"ContractorProfile"> | string | null
    qualificationsAndCertifications?: StringNullableFilter<"ContractorProfile"> | string | null
    languageSpoken?: StringNullableFilter<"ContractorProfile"> | string | null
    hasVehicleAccess?: BoolNullableFilter<"ContractorProfile"> | boolean | null
    funFact?: StringNullableFilter<"ContractorProfile"> | string | null
    hobbiesAndInterests?: StringNullableFilter<"ContractorProfile"> | string | null
    whatMakesBusinessUnique?: StringNullableFilter<"ContractorProfile"> | string | null
    additionalInformation?: StringNullableFilter<"ContractorProfile"> | string | null
    profilePicture?: StringNullableFilter<"ContractorProfile"> | string | null
    lastSyncedAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    createdAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    deletedAt?: DateTimeNullableFilter<"ContractorProfile"> | Date | string | null
  }

  export type ContractorProfileOrderByWithRelationInput = {
    id?: SortOrder
    zohoContactId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    postalZipCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    titleRole?: SortOrderInput | SortOrder
    yearsOfExperience?: SortOrderInput | SortOrder
    aboutYou?: SortOrderInput | SortOrder
    qualificationsAndCertifications?: SortOrderInput | SortOrder
    languageSpoken?: SortOrderInput | SortOrder
    hasVehicleAccess?: SortOrderInput | SortOrder
    funFact?: SortOrderInput | SortOrder
    hobbiesAndInterests?: SortOrderInput | SortOrder
    whatMakesBusinessUnique?: SortOrderInput | SortOrder
    additionalInformation?: SortOrderInput | SortOrder
    profilePicture?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
  }

  export type ContractorProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    zohoContactId?: string
    email?: string
    AND?: ContractorProfileWhereInput | ContractorProfileWhereInput[]
    OR?: ContractorProfileWhereInput[]
    NOT?: ContractorProfileWhereInput | ContractorProfileWhereInput[]
    firstName?: StringFilter<"ContractorProfile"> | string
    lastName?: StringFilter<"ContractorProfile"> | string
    phone?: StringNullableFilter<"ContractorProfile"> | string | null
    gender?: StringNullableFilter<"ContractorProfile"> | string | null
    city?: StringNullableFilter<"ContractorProfile"> | string | null
    state?: StringNullableFilter<"ContractorProfile"> | string | null
    postalZipCode?: StringNullableFilter<"ContractorProfile"> | string | null
    latitude?: FloatNullableFilter<"ContractorProfile"> | number | null
    longitude?: FloatNullableFilter<"ContractorProfile"> | number | null
    titleRole?: StringNullableFilter<"ContractorProfile"> | string | null
    yearsOfExperience?: IntNullableFilter<"ContractorProfile"> | number | null
    aboutYou?: StringNullableFilter<"ContractorProfile"> | string | null
    qualificationsAndCertifications?: StringNullableFilter<"ContractorProfile"> | string | null
    languageSpoken?: StringNullableFilter<"ContractorProfile"> | string | null
    hasVehicleAccess?: BoolNullableFilter<"ContractorProfile"> | boolean | null
    funFact?: StringNullableFilter<"ContractorProfile"> | string | null
    hobbiesAndInterests?: StringNullableFilter<"ContractorProfile"> | string | null
    whatMakesBusinessUnique?: StringNullableFilter<"ContractorProfile"> | string | null
    additionalInformation?: StringNullableFilter<"ContractorProfile"> | string | null
    profilePicture?: StringNullableFilter<"ContractorProfile"> | string | null
    lastSyncedAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    createdAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    updatedAt?: DateTimeFilter<"ContractorProfile"> | Date | string
    deletedAt?: DateTimeNullableFilter<"ContractorProfile"> | Date | string | null
  }, "id" | "zohoContactId" | "email">

  export type ContractorProfileOrderByWithAggregationInput = {
    id?: SortOrder
    zohoContactId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    postalZipCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    titleRole?: SortOrderInput | SortOrder
    yearsOfExperience?: SortOrderInput | SortOrder
    aboutYou?: SortOrderInput | SortOrder
    qualificationsAndCertifications?: SortOrderInput | SortOrder
    languageSpoken?: SortOrderInput | SortOrder
    hasVehicleAccess?: SortOrderInput | SortOrder
    funFact?: SortOrderInput | SortOrder
    hobbiesAndInterests?: SortOrderInput | SortOrder
    whatMakesBusinessUnique?: SortOrderInput | SortOrder
    additionalInformation?: SortOrderInput | SortOrder
    profilePicture?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: ContractorProfileCountOrderByAggregateInput
    _avg?: ContractorProfileAvgOrderByAggregateInput
    _max?: ContractorProfileMaxOrderByAggregateInput
    _min?: ContractorProfileMinOrderByAggregateInput
    _sum?: ContractorProfileSumOrderByAggregateInput
  }

  export type ContractorProfileScalarWhereWithAggregatesInput = {
    AND?: ContractorProfileScalarWhereWithAggregatesInput | ContractorProfileScalarWhereWithAggregatesInput[]
    OR?: ContractorProfileScalarWhereWithAggregatesInput[]
    NOT?: ContractorProfileScalarWhereWithAggregatesInput | ContractorProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContractorProfile"> | string
    zohoContactId?: StringWithAggregatesFilter<"ContractorProfile"> | string
    firstName?: StringWithAggregatesFilter<"ContractorProfile"> | string
    lastName?: StringWithAggregatesFilter<"ContractorProfile"> | string
    email?: StringWithAggregatesFilter<"ContractorProfile"> | string
    phone?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    gender?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    city?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    state?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    postalZipCode?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    latitude?: FloatNullableWithAggregatesFilter<"ContractorProfile"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"ContractorProfile"> | number | null
    titleRole?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    yearsOfExperience?: IntNullableWithAggregatesFilter<"ContractorProfile"> | number | null
    aboutYou?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    qualificationsAndCertifications?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    languageSpoken?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    hasVehicleAccess?: BoolNullableWithAggregatesFilter<"ContractorProfile"> | boolean | null
    funFact?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    hobbiesAndInterests?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    whatMakesBusinessUnique?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    additionalInformation?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    profilePicture?: StringNullableWithAggregatesFilter<"ContractorProfile"> | string | null
    lastSyncedAt?: DateTimeWithAggregatesFilter<"ContractorProfile"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"ContractorProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContractorProfile"> | Date | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"ContractorProfile"> | Date | string | null
  }

  export type ContractorsbyAreaWhereInput = {
    AND?: ContractorsbyAreaWhereInput | ContractorsbyAreaWhereInput[]
    OR?: ContractorsbyAreaWhereInput[]
    NOT?: ContractorsbyAreaWhereInput | ContractorsbyAreaWhereInput[]
    id?: StringFilter<"ContractorsbyArea"> | string
    workerName?: StringFilter<"ContractorsbyArea"> | string
    suburbState?: StringFilter<"ContractorsbyArea"> | string
    image?: StringNullableFilter<"ContractorsbyArea"> | string | null
    bio?: StringNullableFilter<"ContractorsbyArea"> | string | null
    createdAt?: DateTimeFilter<"ContractorsbyArea"> | Date | string
    updatedAt?: DateTimeFilter<"ContractorsbyArea"> | Date | string
  }

  export type ContractorsbyAreaOrderByWithRelationInput = {
    id?: SortOrder
    workerName?: SortOrder
    suburbState?: SortOrder
    image?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContractorsbyAreaWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ContractorsbyAreaWhereInput | ContractorsbyAreaWhereInput[]
    OR?: ContractorsbyAreaWhereInput[]
    NOT?: ContractorsbyAreaWhereInput | ContractorsbyAreaWhereInput[]
    workerName?: StringFilter<"ContractorsbyArea"> | string
    suburbState?: StringFilter<"ContractorsbyArea"> | string
    image?: StringNullableFilter<"ContractorsbyArea"> | string | null
    bio?: StringNullableFilter<"ContractorsbyArea"> | string | null
    createdAt?: DateTimeFilter<"ContractorsbyArea"> | Date | string
    updatedAt?: DateTimeFilter<"ContractorsbyArea"> | Date | string
  }, "id">

  export type ContractorsbyAreaOrderByWithAggregationInput = {
    id?: SortOrder
    workerName?: SortOrder
    suburbState?: SortOrder
    image?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContractorsbyAreaCountOrderByAggregateInput
    _max?: ContractorsbyAreaMaxOrderByAggregateInput
    _min?: ContractorsbyAreaMinOrderByAggregateInput
  }

  export type ContractorsbyAreaScalarWhereWithAggregatesInput = {
    AND?: ContractorsbyAreaScalarWhereWithAggregatesInput | ContractorsbyAreaScalarWhereWithAggregatesInput[]
    OR?: ContractorsbyAreaScalarWhereWithAggregatesInput[]
    NOT?: ContractorsbyAreaScalarWhereWithAggregatesInput | ContractorsbyAreaScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContractorsbyArea"> | string
    workerName?: StringWithAggregatesFilter<"ContractorsbyArea"> | string
    suburbState?: StringWithAggregatesFilter<"ContractorsbyArea"> | string
    image?: StringNullableWithAggregatesFilter<"ContractorsbyArea"> | string | null
    bio?: StringNullableWithAggregatesFilter<"ContractorsbyArea"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ContractorsbyArea"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContractorsbyArea"> | Date | string
  }

  export type JobWhereInput = {
    AND?: JobWhereInput | JobWhereInput[]
    OR?: JobWhereInput[]
    NOT?: JobWhereInput | JobWhereInput[]
    id?: StringFilter<"Job"> | string
    zohoId?: StringFilter<"Job"> | string
    dealName?: StringFilter<"Job"> | string
    title?: StringNullableFilter<"Job"> | string | null
    description?: StringNullableFilter<"Job"> | string | null
    stage?: StringFilter<"Job"> | string
    suburbs?: StringNullableFilter<"Job"> | string | null
    state?: StringNullableFilter<"Job"> | string | null
    serviceAvailed?: StringNullableFilter<"Job"> | string | null
    serviceRequirements?: StringNullableFilter<"Job"> | string | null
    disabilities?: StringNullableFilter<"Job"> | string | null
    behaviouralConcerns?: StringNullableFilter<"Job"> | string | null
    culturalConsiderations?: StringNullableFilter<"Job"> | string | null
    language?: StringNullableFilter<"Job"> | string | null
    religion?: StringNullableFilter<"Job"> | string | null
    age?: StringNullableFilter<"Job"> | string | null
    gender?: StringNullableFilter<"Job"> | string | null
    hobbies?: StringNullableFilter<"Job"> | string | null
    clientName?: StringNullableFilter<"Job"> | string | null
    clientZohoId?: StringNullableFilter<"Job"> | string | null
    relationshipToParticipant?: StringNullableFilter<"Job"> | string | null
    ownerName?: StringNullableFilter<"Job"> | string | null
    ownerEmail?: StringNullableFilter<"Job"> | string | null
    ownerZohoId?: StringNullableFilter<"Job"> | string | null
    postedAt?: DateTimeNullableFilter<"Job"> | Date | string | null
    active?: BoolFilter<"Job"> | boolean
    requiredMoreWorker?: BoolNullableFilter<"Job"> | boolean | null
    anotherContractorNeeded?: BoolNullableFilter<"Job"> | boolean | null
    lastSyncedAt?: DateTimeFilter<"Job"> | Date | string
    createdAt?: DateTimeFilter<"Job"> | Date | string
    updatedAt?: DateTimeFilter<"Job"> | Date | string
  }

  export type JobOrderByWithRelationInput = {
    id?: SortOrder
    zohoId?: SortOrder
    dealName?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    stage?: SortOrder
    suburbs?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    serviceAvailed?: SortOrderInput | SortOrder
    serviceRequirements?: SortOrderInput | SortOrder
    disabilities?: SortOrderInput | SortOrder
    behaviouralConcerns?: SortOrderInput | SortOrder
    culturalConsiderations?: SortOrderInput | SortOrder
    language?: SortOrderInput | SortOrder
    religion?: SortOrderInput | SortOrder
    age?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    hobbies?: SortOrderInput | SortOrder
    clientName?: SortOrderInput | SortOrder
    clientZohoId?: SortOrderInput | SortOrder
    relationshipToParticipant?: SortOrderInput | SortOrder
    ownerName?: SortOrderInput | SortOrder
    ownerEmail?: SortOrderInput | SortOrder
    ownerZohoId?: SortOrderInput | SortOrder
    postedAt?: SortOrderInput | SortOrder
    active?: SortOrder
    requiredMoreWorker?: SortOrderInput | SortOrder
    anotherContractorNeeded?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    zohoId?: string
    AND?: JobWhereInput | JobWhereInput[]
    OR?: JobWhereInput[]
    NOT?: JobWhereInput | JobWhereInput[]
    dealName?: StringFilter<"Job"> | string
    title?: StringNullableFilter<"Job"> | string | null
    description?: StringNullableFilter<"Job"> | string | null
    stage?: StringFilter<"Job"> | string
    suburbs?: StringNullableFilter<"Job"> | string | null
    state?: StringNullableFilter<"Job"> | string | null
    serviceAvailed?: StringNullableFilter<"Job"> | string | null
    serviceRequirements?: StringNullableFilter<"Job"> | string | null
    disabilities?: StringNullableFilter<"Job"> | string | null
    behaviouralConcerns?: StringNullableFilter<"Job"> | string | null
    culturalConsiderations?: StringNullableFilter<"Job"> | string | null
    language?: StringNullableFilter<"Job"> | string | null
    religion?: StringNullableFilter<"Job"> | string | null
    age?: StringNullableFilter<"Job"> | string | null
    gender?: StringNullableFilter<"Job"> | string | null
    hobbies?: StringNullableFilter<"Job"> | string | null
    clientName?: StringNullableFilter<"Job"> | string | null
    clientZohoId?: StringNullableFilter<"Job"> | string | null
    relationshipToParticipant?: StringNullableFilter<"Job"> | string | null
    ownerName?: StringNullableFilter<"Job"> | string | null
    ownerEmail?: StringNullableFilter<"Job"> | string | null
    ownerZohoId?: StringNullableFilter<"Job"> | string | null
    postedAt?: DateTimeNullableFilter<"Job"> | Date | string | null
    active?: BoolFilter<"Job"> | boolean
    requiredMoreWorker?: BoolNullableFilter<"Job"> | boolean | null
    anotherContractorNeeded?: BoolNullableFilter<"Job"> | boolean | null
    lastSyncedAt?: DateTimeFilter<"Job"> | Date | string
    createdAt?: DateTimeFilter<"Job"> | Date | string
    updatedAt?: DateTimeFilter<"Job"> | Date | string
  }, "id" | "zohoId">

  export type JobOrderByWithAggregationInput = {
    id?: SortOrder
    zohoId?: SortOrder
    dealName?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    stage?: SortOrder
    suburbs?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    serviceAvailed?: SortOrderInput | SortOrder
    serviceRequirements?: SortOrderInput | SortOrder
    disabilities?: SortOrderInput | SortOrder
    behaviouralConcerns?: SortOrderInput | SortOrder
    culturalConsiderations?: SortOrderInput | SortOrder
    language?: SortOrderInput | SortOrder
    religion?: SortOrderInput | SortOrder
    age?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    hobbies?: SortOrderInput | SortOrder
    clientName?: SortOrderInput | SortOrder
    clientZohoId?: SortOrderInput | SortOrder
    relationshipToParticipant?: SortOrderInput | SortOrder
    ownerName?: SortOrderInput | SortOrder
    ownerEmail?: SortOrderInput | SortOrder
    ownerZohoId?: SortOrderInput | SortOrder
    postedAt?: SortOrderInput | SortOrder
    active?: SortOrder
    requiredMoreWorker?: SortOrderInput | SortOrder
    anotherContractorNeeded?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: JobCountOrderByAggregateInput
    _max?: JobMaxOrderByAggregateInput
    _min?: JobMinOrderByAggregateInput
  }

  export type JobScalarWhereWithAggregatesInput = {
    AND?: JobScalarWhereWithAggregatesInput | JobScalarWhereWithAggregatesInput[]
    OR?: JobScalarWhereWithAggregatesInput[]
    NOT?: JobScalarWhereWithAggregatesInput | JobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Job"> | string
    zohoId?: StringWithAggregatesFilter<"Job"> | string
    dealName?: StringWithAggregatesFilter<"Job"> | string
    title?: StringNullableWithAggregatesFilter<"Job"> | string | null
    description?: StringNullableWithAggregatesFilter<"Job"> | string | null
    stage?: StringWithAggregatesFilter<"Job"> | string
    suburbs?: StringNullableWithAggregatesFilter<"Job"> | string | null
    state?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceAvailed?: StringNullableWithAggregatesFilter<"Job"> | string | null
    serviceRequirements?: StringNullableWithAggregatesFilter<"Job"> | string | null
    disabilities?: StringNullableWithAggregatesFilter<"Job"> | string | null
    behaviouralConcerns?: StringNullableWithAggregatesFilter<"Job"> | string | null
    culturalConsiderations?: StringNullableWithAggregatesFilter<"Job"> | string | null
    language?: StringNullableWithAggregatesFilter<"Job"> | string | null
    religion?: StringNullableWithAggregatesFilter<"Job"> | string | null
    age?: StringNullableWithAggregatesFilter<"Job"> | string | null
    gender?: StringNullableWithAggregatesFilter<"Job"> | string | null
    hobbies?: StringNullableWithAggregatesFilter<"Job"> | string | null
    clientName?: StringNullableWithAggregatesFilter<"Job"> | string | null
    clientZohoId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    relationshipToParticipant?: StringNullableWithAggregatesFilter<"Job"> | string | null
    ownerName?: StringNullableWithAggregatesFilter<"Job"> | string | null
    ownerEmail?: StringNullableWithAggregatesFilter<"Job"> | string | null
    ownerZohoId?: StringNullableWithAggregatesFilter<"Job"> | string | null
    postedAt?: DateTimeNullableWithAggregatesFilter<"Job"> | Date | string | null
    active?: BoolWithAggregatesFilter<"Job"> | boolean
    requiredMoreWorker?: BoolNullableWithAggregatesFilter<"Job"> | boolean | null
    anotherContractorNeeded?: BoolNullableWithAggregatesFilter<"Job"> | boolean | null
    lastSyncedAt?: DateTimeWithAggregatesFilter<"Job"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Job"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Job"> | Date | string
  }

  export type ContractorProfileCreateInput = {
    id?: string
    zohoContactId: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    gender?: string | null
    city?: string | null
    state?: string | null
    postalZipCode?: string | null
    latitude?: number | null
    longitude?: number | null
    titleRole?: string | null
    yearsOfExperience?: number | null
    aboutYou?: string | null
    qualificationsAndCertifications?: string | null
    languageSpoken?: string | null
    hasVehicleAccess?: boolean | null
    funFact?: string | null
    hobbiesAndInterests?: string | null
    whatMakesBusinessUnique?: string | null
    additionalInformation?: string | null
    profilePicture?: string | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ContractorProfileUncheckedCreateInput = {
    id?: string
    zohoContactId: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    gender?: string | null
    city?: string | null
    state?: string | null
    postalZipCode?: string | null
    latitude?: number | null
    longitude?: number | null
    titleRole?: string | null
    yearsOfExperience?: number | null
    aboutYou?: string | null
    qualificationsAndCertifications?: string | null
    languageSpoken?: string | null
    hasVehicleAccess?: boolean | null
    funFact?: string | null
    hobbiesAndInterests?: string | null
    whatMakesBusinessUnique?: string | null
    additionalInformation?: string | null
    profilePicture?: string | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ContractorProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoContactId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalZipCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    titleRole?: NullableStringFieldUpdateOperationsInput | string | null
    yearsOfExperience?: NullableIntFieldUpdateOperationsInput | number | null
    aboutYou?: NullableStringFieldUpdateOperationsInput | string | null
    qualificationsAndCertifications?: NullableStringFieldUpdateOperationsInput | string | null
    languageSpoken?: NullableStringFieldUpdateOperationsInput | string | null
    hasVehicleAccess?: NullableBoolFieldUpdateOperationsInput | boolean | null
    funFact?: NullableStringFieldUpdateOperationsInput | string | null
    hobbiesAndInterests?: NullableStringFieldUpdateOperationsInput | string | null
    whatMakesBusinessUnique?: NullableStringFieldUpdateOperationsInput | string | null
    additionalInformation?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ContractorProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoContactId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalZipCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    titleRole?: NullableStringFieldUpdateOperationsInput | string | null
    yearsOfExperience?: NullableIntFieldUpdateOperationsInput | number | null
    aboutYou?: NullableStringFieldUpdateOperationsInput | string | null
    qualificationsAndCertifications?: NullableStringFieldUpdateOperationsInput | string | null
    languageSpoken?: NullableStringFieldUpdateOperationsInput | string | null
    hasVehicleAccess?: NullableBoolFieldUpdateOperationsInput | boolean | null
    funFact?: NullableStringFieldUpdateOperationsInput | string | null
    hobbiesAndInterests?: NullableStringFieldUpdateOperationsInput | string | null
    whatMakesBusinessUnique?: NullableStringFieldUpdateOperationsInput | string | null
    additionalInformation?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ContractorProfileCreateManyInput = {
    id?: string
    zohoContactId: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    gender?: string | null
    city?: string | null
    state?: string | null
    postalZipCode?: string | null
    latitude?: number | null
    longitude?: number | null
    titleRole?: string | null
    yearsOfExperience?: number | null
    aboutYou?: string | null
    qualificationsAndCertifications?: string | null
    languageSpoken?: string | null
    hasVehicleAccess?: boolean | null
    funFact?: string | null
    hobbiesAndInterests?: string | null
    whatMakesBusinessUnique?: string | null
    additionalInformation?: string | null
    profilePicture?: string | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    deletedAt?: Date | string | null
  }

  export type ContractorProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoContactId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalZipCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    titleRole?: NullableStringFieldUpdateOperationsInput | string | null
    yearsOfExperience?: NullableIntFieldUpdateOperationsInput | number | null
    aboutYou?: NullableStringFieldUpdateOperationsInput | string | null
    qualificationsAndCertifications?: NullableStringFieldUpdateOperationsInput | string | null
    languageSpoken?: NullableStringFieldUpdateOperationsInput | string | null
    hasVehicleAccess?: NullableBoolFieldUpdateOperationsInput | boolean | null
    funFact?: NullableStringFieldUpdateOperationsInput | string | null
    hobbiesAndInterests?: NullableStringFieldUpdateOperationsInput | string | null
    whatMakesBusinessUnique?: NullableStringFieldUpdateOperationsInput | string | null
    additionalInformation?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ContractorProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoContactId?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    postalZipCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    titleRole?: NullableStringFieldUpdateOperationsInput | string | null
    yearsOfExperience?: NullableIntFieldUpdateOperationsInput | number | null
    aboutYou?: NullableStringFieldUpdateOperationsInput | string | null
    qualificationsAndCertifications?: NullableStringFieldUpdateOperationsInput | string | null
    languageSpoken?: NullableStringFieldUpdateOperationsInput | string | null
    hasVehicleAccess?: NullableBoolFieldUpdateOperationsInput | boolean | null
    funFact?: NullableStringFieldUpdateOperationsInput | string | null
    hobbiesAndInterests?: NullableStringFieldUpdateOperationsInput | string | null
    whatMakesBusinessUnique?: NullableStringFieldUpdateOperationsInput | string | null
    additionalInformation?: NullableStringFieldUpdateOperationsInput | string | null
    profilePicture?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ContractorsbyAreaCreateInput = {
    id: string
    workerName: string
    suburbState: string
    image?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type ContractorsbyAreaUncheckedCreateInput = {
    id: string
    workerName: string
    suburbState: string
    image?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type ContractorsbyAreaUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerName?: StringFieldUpdateOperationsInput | string
    suburbState?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractorsbyAreaUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerName?: StringFieldUpdateOperationsInput | string
    suburbState?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractorsbyAreaCreateManyInput = {
    id: string
    workerName: string
    suburbState: string
    image?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type ContractorsbyAreaUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerName?: StringFieldUpdateOperationsInput | string
    suburbState?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractorsbyAreaUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    workerName?: StringFieldUpdateOperationsInput | string
    suburbState?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCreateInput = {
    id: string
    zohoId: string
    dealName: string
    title?: string | null
    description?: string | null
    stage: string
    suburbs?: string | null
    state?: string | null
    serviceAvailed?: string | null
    serviceRequirements?: string | null
    disabilities?: string | null
    behaviouralConcerns?: string | null
    culturalConsiderations?: string | null
    language?: string | null
    religion?: string | null
    age?: string | null
    gender?: string | null
    hobbies?: string | null
    clientName?: string | null
    clientZohoId?: string | null
    relationshipToParticipant?: string | null
    ownerName?: string | null
    ownerEmail?: string | null
    ownerZohoId?: string | null
    postedAt?: Date | string | null
    active?: boolean
    requiredMoreWorker?: boolean | null
    anotherContractorNeeded?: boolean | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type JobUncheckedCreateInput = {
    id: string
    zohoId: string
    dealName: string
    title?: string | null
    description?: string | null
    stage: string
    suburbs?: string | null
    state?: string | null
    serviceAvailed?: string | null
    serviceRequirements?: string | null
    disabilities?: string | null
    behaviouralConcerns?: string | null
    culturalConsiderations?: string | null
    language?: string | null
    religion?: string | null
    age?: string | null
    gender?: string | null
    hobbies?: string | null
    clientName?: string | null
    clientZohoId?: string | null
    relationshipToParticipant?: string | null
    ownerName?: string | null
    ownerEmail?: string | null
    ownerZohoId?: string | null
    postedAt?: Date | string | null
    active?: boolean
    requiredMoreWorker?: boolean | null
    anotherContractorNeeded?: boolean | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type JobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: StringFieldUpdateOperationsInput | string
    suburbs?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAvailed?: NullableStringFieldUpdateOperationsInput | string | null
    serviceRequirements?: NullableStringFieldUpdateOperationsInput | string | null
    disabilities?: NullableStringFieldUpdateOperationsInput | string | null
    behaviouralConcerns?: NullableStringFieldUpdateOperationsInput | string | null
    culturalConsiderations?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    religion?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    hobbies?: NullableStringFieldUpdateOperationsInput | string | null
    clientName?: NullableStringFieldUpdateOperationsInput | string | null
    clientZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    relationshipToParticipant?: NullableStringFieldUpdateOperationsInput | string | null
    ownerName?: NullableStringFieldUpdateOperationsInput | string | null
    ownerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    ownerZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    requiredMoreWorker?: NullableBoolFieldUpdateOperationsInput | boolean | null
    anotherContractorNeeded?: NullableBoolFieldUpdateOperationsInput | boolean | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: StringFieldUpdateOperationsInput | string
    suburbs?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAvailed?: NullableStringFieldUpdateOperationsInput | string | null
    serviceRequirements?: NullableStringFieldUpdateOperationsInput | string | null
    disabilities?: NullableStringFieldUpdateOperationsInput | string | null
    behaviouralConcerns?: NullableStringFieldUpdateOperationsInput | string | null
    culturalConsiderations?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    religion?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    hobbies?: NullableStringFieldUpdateOperationsInput | string | null
    clientName?: NullableStringFieldUpdateOperationsInput | string | null
    clientZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    relationshipToParticipant?: NullableStringFieldUpdateOperationsInput | string | null
    ownerName?: NullableStringFieldUpdateOperationsInput | string | null
    ownerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    ownerZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    requiredMoreWorker?: NullableBoolFieldUpdateOperationsInput | boolean | null
    anotherContractorNeeded?: NullableBoolFieldUpdateOperationsInput | boolean | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobCreateManyInput = {
    id: string
    zohoId: string
    dealName: string
    title?: string | null
    description?: string | null
    stage: string
    suburbs?: string | null
    state?: string | null
    serviceAvailed?: string | null
    serviceRequirements?: string | null
    disabilities?: string | null
    behaviouralConcerns?: string | null
    culturalConsiderations?: string | null
    language?: string | null
    religion?: string | null
    age?: string | null
    gender?: string | null
    hobbies?: string | null
    clientName?: string | null
    clientZohoId?: string | null
    relationshipToParticipant?: string | null
    ownerName?: string | null
    ownerEmail?: string | null
    ownerZohoId?: string | null
    postedAt?: Date | string | null
    active?: boolean
    requiredMoreWorker?: boolean | null
    anotherContractorNeeded?: boolean | null
    lastSyncedAt?: Date | string
    createdAt?: Date | string
    updatedAt: Date | string
  }

  export type JobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: StringFieldUpdateOperationsInput | string
    suburbs?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAvailed?: NullableStringFieldUpdateOperationsInput | string | null
    serviceRequirements?: NullableStringFieldUpdateOperationsInput | string | null
    disabilities?: NullableStringFieldUpdateOperationsInput | string | null
    behaviouralConcerns?: NullableStringFieldUpdateOperationsInput | string | null
    culturalConsiderations?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    religion?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    hobbies?: NullableStringFieldUpdateOperationsInput | string | null
    clientName?: NullableStringFieldUpdateOperationsInput | string | null
    clientZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    relationshipToParticipant?: NullableStringFieldUpdateOperationsInput | string | null
    ownerName?: NullableStringFieldUpdateOperationsInput | string | null
    ownerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    ownerZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    requiredMoreWorker?: NullableBoolFieldUpdateOperationsInput | boolean | null
    anotherContractorNeeded?: NullableBoolFieldUpdateOperationsInput | boolean | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type JobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    zohoId?: StringFieldUpdateOperationsInput | string
    dealName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    stage?: StringFieldUpdateOperationsInput | string
    suburbs?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    serviceAvailed?: NullableStringFieldUpdateOperationsInput | string | null
    serviceRequirements?: NullableStringFieldUpdateOperationsInput | string | null
    disabilities?: NullableStringFieldUpdateOperationsInput | string | null
    behaviouralConcerns?: NullableStringFieldUpdateOperationsInput | string | null
    culturalConsiderations?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    religion?: NullableStringFieldUpdateOperationsInput | string | null
    age?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    hobbies?: NullableStringFieldUpdateOperationsInput | string | null
    clientName?: NullableStringFieldUpdateOperationsInput | string | null
    clientZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    relationshipToParticipant?: NullableStringFieldUpdateOperationsInput | string | null
    ownerName?: NullableStringFieldUpdateOperationsInput | string | null
    ownerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    ownerZohoId?: NullableStringFieldUpdateOperationsInput | string | null
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    active?: BoolFieldUpdateOperationsInput | boolean
    requiredMoreWorker?: NullableBoolFieldUpdateOperationsInput | boolean | null
    anotherContractorNeeded?: NullableBoolFieldUpdateOperationsInput | boolean | null
    lastSyncedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
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

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ContractorProfileCountOrderByAggregateInput = {
    id?: SortOrder
    zohoContactId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    gender?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalZipCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    titleRole?: SortOrder
    yearsOfExperience?: SortOrder
    aboutYou?: SortOrder
    qualificationsAndCertifications?: SortOrder
    languageSpoken?: SortOrder
    hasVehicleAccess?: SortOrder
    funFact?: SortOrder
    hobbiesAndInterests?: SortOrder
    whatMakesBusinessUnique?: SortOrder
    additionalInformation?: SortOrder
    profilePicture?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ContractorProfileAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    yearsOfExperience?: SortOrder
  }

  export type ContractorProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    zohoContactId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    gender?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalZipCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    titleRole?: SortOrder
    yearsOfExperience?: SortOrder
    aboutYou?: SortOrder
    qualificationsAndCertifications?: SortOrder
    languageSpoken?: SortOrder
    hasVehicleAccess?: SortOrder
    funFact?: SortOrder
    hobbiesAndInterests?: SortOrder
    whatMakesBusinessUnique?: SortOrder
    additionalInformation?: SortOrder
    profilePicture?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ContractorProfileMinOrderByAggregateInput = {
    id?: SortOrder
    zohoContactId?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    gender?: SortOrder
    city?: SortOrder
    state?: SortOrder
    postalZipCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    titleRole?: SortOrder
    yearsOfExperience?: SortOrder
    aboutYou?: SortOrder
    qualificationsAndCertifications?: SortOrder
    languageSpoken?: SortOrder
    hasVehicleAccess?: SortOrder
    funFact?: SortOrder
    hobbiesAndInterests?: SortOrder
    whatMakesBusinessUnique?: SortOrder
    additionalInformation?: SortOrder
    profilePicture?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    deletedAt?: SortOrder
  }

  export type ContractorProfileSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
    yearsOfExperience?: SortOrder
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

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
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

  export type ContractorsbyAreaCountOrderByAggregateInput = {
    id?: SortOrder
    workerName?: SortOrder
    suburbState?: SortOrder
    image?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContractorsbyAreaMaxOrderByAggregateInput = {
    id?: SortOrder
    workerName?: SortOrder
    suburbState?: SortOrder
    image?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContractorsbyAreaMinOrderByAggregateInput = {
    id?: SortOrder
    workerName?: SortOrder
    suburbState?: SortOrder
    image?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type JobCountOrderByAggregateInput = {
    id?: SortOrder
    zohoId?: SortOrder
    dealName?: SortOrder
    title?: SortOrder
    description?: SortOrder
    stage?: SortOrder
    suburbs?: SortOrder
    state?: SortOrder
    serviceAvailed?: SortOrder
    serviceRequirements?: SortOrder
    disabilities?: SortOrder
    behaviouralConcerns?: SortOrder
    culturalConsiderations?: SortOrder
    language?: SortOrder
    religion?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    hobbies?: SortOrder
    clientName?: SortOrder
    clientZohoId?: SortOrder
    relationshipToParticipant?: SortOrder
    ownerName?: SortOrder
    ownerEmail?: SortOrder
    ownerZohoId?: SortOrder
    postedAt?: SortOrder
    active?: SortOrder
    requiredMoreWorker?: SortOrder
    anotherContractorNeeded?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobMaxOrderByAggregateInput = {
    id?: SortOrder
    zohoId?: SortOrder
    dealName?: SortOrder
    title?: SortOrder
    description?: SortOrder
    stage?: SortOrder
    suburbs?: SortOrder
    state?: SortOrder
    serviceAvailed?: SortOrder
    serviceRequirements?: SortOrder
    disabilities?: SortOrder
    behaviouralConcerns?: SortOrder
    culturalConsiderations?: SortOrder
    language?: SortOrder
    religion?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    hobbies?: SortOrder
    clientName?: SortOrder
    clientZohoId?: SortOrder
    relationshipToParticipant?: SortOrder
    ownerName?: SortOrder
    ownerEmail?: SortOrder
    ownerZohoId?: SortOrder
    postedAt?: SortOrder
    active?: SortOrder
    requiredMoreWorker?: SortOrder
    anotherContractorNeeded?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type JobMinOrderByAggregateInput = {
    id?: SortOrder
    zohoId?: SortOrder
    dealName?: SortOrder
    title?: SortOrder
    description?: SortOrder
    stage?: SortOrder
    suburbs?: SortOrder
    state?: SortOrder
    serviceAvailed?: SortOrder
    serviceRequirements?: SortOrder
    disabilities?: SortOrder
    behaviouralConcerns?: SortOrder
    culturalConsiderations?: SortOrder
    language?: SortOrder
    religion?: SortOrder
    age?: SortOrder
    gender?: SortOrder
    hobbies?: SortOrder
    clientName?: SortOrder
    clientZohoId?: SortOrder
    relationshipToParticipant?: SortOrder
    ownerName?: SortOrder
    ownerEmail?: SortOrder
    ownerZohoId?: SortOrder
    postedAt?: SortOrder
    active?: SortOrder
    requiredMoreWorker?: SortOrder
    anotherContractorNeeded?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
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

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
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

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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