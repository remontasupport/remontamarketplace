
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
 * Model Document
 * 
 */
export type Document = $Result.DefaultSelection<Prisma.$DocumentPayload>
/**
 * Model Category
 * 
 */
export type Category = $Result.DefaultSelection<Prisma.$CategoryPayload>
/**
 * Model Subcategory
 * 
 */
export type Subcategory = $Result.DefaultSelection<Prisma.$SubcategoryPayload>
/**
 * Model CategoryDocument
 * 
 */
export type CategoryDocument = $Result.DefaultSelection<Prisma.$CategoryDocumentPayload>
/**
 * Model SubcategoryDocument
 * 
 */
export type SubcategoryDocument = $Result.DefaultSelection<Prisma.$SubcategoryDocumentPayload>

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

  /**
   * `prisma.document`: Exposes CRUD operations for the **Document** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Documents
    * const documents = await prisma.document.findMany()
    * ```
    */
  get document(): Prisma.DocumentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.category`: Exposes CRUD operations for the **Category** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Categories
    * const categories = await prisma.category.findMany()
    * ```
    */
  get category(): Prisma.CategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subcategory`: Exposes CRUD operations for the **Subcategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subcategories
    * const subcategories = await prisma.subcategory.findMany()
    * ```
    */
  get subcategory(): Prisma.SubcategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.categoryDocument`: Exposes CRUD operations for the **CategoryDocument** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CategoryDocuments
    * const categoryDocuments = await prisma.categoryDocument.findMany()
    * ```
    */
  get categoryDocument(): Prisma.CategoryDocumentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subcategoryDocument`: Exposes CRUD operations for the **SubcategoryDocument** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SubcategoryDocuments
    * const subcategoryDocuments = await prisma.subcategoryDocument.findMany()
    * ```
    */
  get subcategoryDocument(): Prisma.SubcategoryDocumentDelegate<ExtArgs, ClientOptions>;
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
    Job: 'Job',
    Document: 'Document',
    Category: 'Category',
    Subcategory: 'Subcategory',
    CategoryDocument: 'CategoryDocument',
    SubcategoryDocument: 'SubcategoryDocument'
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
      modelProps: "contractorProfile" | "contractorsbyArea" | "job" | "document" | "category" | "subcategory" | "categoryDocument" | "subcategoryDocument"
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
      Document: {
        payload: Prisma.$DocumentPayload<ExtArgs>
        fields: Prisma.DocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findFirst: {
            args: Prisma.DocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          findMany: {
            args: Prisma.DocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          create: {
            args: Prisma.DocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          createMany: {
            args: Prisma.DocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          delete: {
            args: Prisma.DocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          update: {
            args: Prisma.DocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          deleteMany: {
            args: Prisma.DocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>[]
          }
          upsert: {
            args: Prisma.DocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DocumentPayload>
          }
          aggregate: {
            args: Prisma.DocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDocument>
          }
          groupBy: {
            args: Prisma.DocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<DocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.DocumentCountArgs<ExtArgs>
            result: $Utils.Optional<DocumentCountAggregateOutputType> | number
          }
        }
      }
      Category: {
        payload: Prisma.$CategoryPayload<ExtArgs>
        fields: Prisma.CategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findFirst: {
            args: Prisma.CategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          findMany: {
            args: Prisma.CategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          create: {
            args: Prisma.CategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          createMany: {
            args: Prisma.CategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          delete: {
            args: Prisma.CategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          update: {
            args: Prisma.CategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>[]
          }
          upsert: {
            args: Prisma.CategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryPayload>
          }
          aggregate: {
            args: Prisma.CategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategory>
          }
          groupBy: {
            args: Prisma.CategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryCountAggregateOutputType> | number
          }
        }
      }
      Subcategory: {
        payload: Prisma.$SubcategoryPayload<ExtArgs>
        fields: Prisma.SubcategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubcategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubcategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          findFirst: {
            args: Prisma.SubcategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubcategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          findMany: {
            args: Prisma.SubcategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          create: {
            args: Prisma.SubcategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          createMany: {
            args: Prisma.SubcategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubcategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          delete: {
            args: Prisma.SubcategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          update: {
            args: Prisma.SubcategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          deleteMany: {
            args: Prisma.SubcategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubcategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubcategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>[]
          }
          upsert: {
            args: Prisma.SubcategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryPayload>
          }
          aggregate: {
            args: Prisma.SubcategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubcategory>
          }
          groupBy: {
            args: Prisma.SubcategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubcategoryCountArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryCountAggregateOutputType> | number
          }
        }
      }
      CategoryDocument: {
        payload: Prisma.$CategoryDocumentPayload<ExtArgs>
        fields: Prisma.CategoryDocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CategoryDocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CategoryDocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          findFirst: {
            args: Prisma.CategoryDocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CategoryDocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          findMany: {
            args: Prisma.CategoryDocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>[]
          }
          create: {
            args: Prisma.CategoryDocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          createMany: {
            args: Prisma.CategoryDocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CategoryDocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>[]
          }
          delete: {
            args: Prisma.CategoryDocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          update: {
            args: Prisma.CategoryDocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          deleteMany: {
            args: Prisma.CategoryDocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CategoryDocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CategoryDocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>[]
          }
          upsert: {
            args: Prisma.CategoryDocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CategoryDocumentPayload>
          }
          aggregate: {
            args: Prisma.CategoryDocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCategoryDocument>
          }
          groupBy: {
            args: Prisma.CategoryDocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<CategoryDocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.CategoryDocumentCountArgs<ExtArgs>
            result: $Utils.Optional<CategoryDocumentCountAggregateOutputType> | number
          }
        }
      }
      SubcategoryDocument: {
        payload: Prisma.$SubcategoryDocumentPayload<ExtArgs>
        fields: Prisma.SubcategoryDocumentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubcategoryDocumentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubcategoryDocumentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          findFirst: {
            args: Prisma.SubcategoryDocumentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubcategoryDocumentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          findMany: {
            args: Prisma.SubcategoryDocumentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>[]
          }
          create: {
            args: Prisma.SubcategoryDocumentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          createMany: {
            args: Prisma.SubcategoryDocumentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubcategoryDocumentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>[]
          }
          delete: {
            args: Prisma.SubcategoryDocumentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          update: {
            args: Prisma.SubcategoryDocumentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          deleteMany: {
            args: Prisma.SubcategoryDocumentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubcategoryDocumentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubcategoryDocumentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>[]
          }
          upsert: {
            args: Prisma.SubcategoryDocumentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubcategoryDocumentPayload>
          }
          aggregate: {
            args: Prisma.SubcategoryDocumentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubcategoryDocument>
          }
          groupBy: {
            args: Prisma.SubcategoryDocumentGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryDocumentGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubcategoryDocumentCountArgs<ExtArgs>
            result: $Utils.Optional<SubcategoryDocumentCountAggregateOutputType> | number
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
    document?: DocumentOmit
    category?: CategoryOmit
    subcategory?: SubcategoryOmit
    categoryDocument?: CategoryDocumentOmit
    subcategoryDocument?: SubcategoryDocumentOmit
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
   * Count Type DocumentCountOutputType
   */

  export type DocumentCountOutputType = {
    categoryDocuments: number
    subcategoryDocuments: number
  }

  export type DocumentCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categoryDocuments?: boolean | DocumentCountOutputTypeCountCategoryDocumentsArgs
    subcategoryDocuments?: boolean | DocumentCountOutputTypeCountSubcategoryDocumentsArgs
  }

  // Custom InputTypes
  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DocumentCountOutputType
     */
    select?: DocumentCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeCountCategoryDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryDocumentWhereInput
  }

  /**
   * DocumentCountOutputType without action
   */
  export type DocumentCountOutputTypeCountSubcategoryDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryDocumentWhereInput
  }


  /**
   * Count Type CategoryCountOutputType
   */

  export type CategoryCountOutputType = {
    subcategories: number
    documents: number
  }

  export type CategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategories?: boolean | CategoryCountOutputTypeCountSubcategoriesArgs
    documents?: boolean | CategoryCountOutputTypeCountDocumentsArgs
  }

  // Custom InputTypes
  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryCountOutputType
     */
    select?: CategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountSubcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryWhereInput
  }

  /**
   * CategoryCountOutputType without action
   */
  export type CategoryCountOutputTypeCountDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryDocumentWhereInput
  }


  /**
   * Count Type SubcategoryCountOutputType
   */

  export type SubcategoryCountOutputType = {
    additionalDocuments: number
  }

  export type SubcategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    additionalDocuments?: boolean | SubcategoryCountOutputTypeCountAdditionalDocumentsArgs
  }

  // Custom InputTypes
  /**
   * SubcategoryCountOutputType without action
   */
  export type SubcategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryCountOutputType
     */
    select?: SubcategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SubcategoryCountOutputType without action
   */
  export type SubcategoryCountOutputTypeCountAdditionalDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryDocumentWhereInput
  }


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
   * Model Document
   */

  export type AggregateDocument = {
    _count: DocumentCountAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  export type DocumentMinAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    description: string | null
    hasExpiration: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DocumentMaxAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    description: string | null
    hasExpiration: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DocumentCountAggregateOutputType = {
    id: number
    name: number
    category: number
    description: number
    hasExpiration: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DocumentMinAggregateInputType = {
    id?: true
    name?: true
    category?: true
    description?: true
    hasExpiration?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DocumentMaxAggregateInputType = {
    id?: true
    name?: true
    category?: true
    description?: true
    hasExpiration?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DocumentCountAggregateInputType = {
    id?: true
    name?: true
    category?: true
    description?: true
    hasExpiration?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Document to aggregate.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Documents
    **/
    _count?: true | DocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DocumentMaxAggregateInputType
  }

  export type GetDocumentAggregateType<T extends DocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDocument[P]>
      : GetScalarType<T[P], AggregateDocument[P]>
  }




  export type DocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DocumentWhereInput
    orderBy?: DocumentOrderByWithAggregationInput | DocumentOrderByWithAggregationInput[]
    by: DocumentScalarFieldEnum[] | DocumentScalarFieldEnum
    having?: DocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DocumentCountAggregateInputType | true
    _min?: DocumentMinAggregateInputType
    _max?: DocumentMaxAggregateInputType
  }

  export type DocumentGroupByOutputType = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration: boolean
    createdAt: Date
    updatedAt: Date
    _count: DocumentCountAggregateOutputType | null
    _min: DocumentMinAggregateOutputType | null
    _max: DocumentMaxAggregateOutputType | null
  }

  type GetDocumentGroupByPayload<T extends DocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DocumentGroupByOutputType[P]>
            : GetScalarType<T[P], DocumentGroupByOutputType[P]>
        }
      >
    >


  export type DocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    description?: boolean
    hasExpiration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    categoryDocuments?: boolean | Document$categoryDocumentsArgs<ExtArgs>
    subcategoryDocuments?: boolean | Document$subcategoryDocumentsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    description?: boolean
    hasExpiration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    description?: boolean
    hasExpiration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["document"]>

  export type DocumentSelectScalar = {
    id?: boolean
    name?: boolean
    category?: boolean
    description?: boolean
    hasExpiration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "category" | "description" | "hasExpiration" | "createdAt" | "updatedAt", ExtArgs["result"]["document"]>
  export type DocumentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    categoryDocuments?: boolean | Document$categoryDocumentsArgs<ExtArgs>
    subcategoryDocuments?: boolean | Document$subcategoryDocumentsArgs<ExtArgs>
    _count?: boolean | DocumentCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type DocumentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type DocumentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $DocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Document"
    objects: {
      categoryDocuments: Prisma.$CategoryDocumentPayload<ExtArgs>[]
      subcategoryDocuments: Prisma.$SubcategoryDocumentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      category: string
      description: string
      hasExpiration: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["document"]>
    composites: {}
  }

  type DocumentGetPayload<S extends boolean | null | undefined | DocumentDefaultArgs> = $Result.GetResult<Prisma.$DocumentPayload, S>

  type DocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DocumentCountAggregateInputType | true
    }

  export interface DocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Document'], meta: { name: 'Document' } }
    /**
     * Find zero or one Document that matches the filter.
     * @param {DocumentFindUniqueArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DocumentFindUniqueArgs>(args: SelectSubset<T, DocumentFindUniqueArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Document that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DocumentFindUniqueOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, DocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DocumentFindFirstArgs>(args?: SelectSubset<T, DocumentFindFirstArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Document that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindFirstOrThrowArgs} args - Arguments to find a Document
     * @example
     * // Get one Document
     * const document = await prisma.document.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, DocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Documents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Documents
     * const documents = await prisma.document.findMany()
     * 
     * // Get first 10 Documents
     * const documents = await prisma.document.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const documentWithIdOnly = await prisma.document.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DocumentFindManyArgs>(args?: SelectSubset<T, DocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Document.
     * @param {DocumentCreateArgs} args - Arguments to create a Document.
     * @example
     * // Create one Document
     * const Document = await prisma.document.create({
     *   data: {
     *     // ... data to create a Document
     *   }
     * })
     * 
     */
    create<T extends DocumentCreateArgs>(args: SelectSubset<T, DocumentCreateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Documents.
     * @param {DocumentCreateManyArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DocumentCreateManyArgs>(args?: SelectSubset<T, DocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Documents and returns the data saved in the database.
     * @param {DocumentCreateManyAndReturnArgs} args - Arguments to create many Documents.
     * @example
     * // Create many Documents
     * const document = await prisma.document.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, DocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Document.
     * @param {DocumentDeleteArgs} args - Arguments to delete one Document.
     * @example
     * // Delete one Document
     * const Document = await prisma.document.delete({
     *   where: {
     *     // ... filter to delete one Document
     *   }
     * })
     * 
     */
    delete<T extends DocumentDeleteArgs>(args: SelectSubset<T, DocumentDeleteArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Document.
     * @param {DocumentUpdateArgs} args - Arguments to update one Document.
     * @example
     * // Update one Document
     * const document = await prisma.document.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DocumentUpdateArgs>(args: SelectSubset<T, DocumentUpdateArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Documents.
     * @param {DocumentDeleteManyArgs} args - Arguments to filter Documents to delete.
     * @example
     * // Delete a few Documents
     * const { count } = await prisma.document.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DocumentDeleteManyArgs>(args?: SelectSubset<T, DocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DocumentUpdateManyArgs>(args: SelectSubset<T, DocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Documents and returns the data updated in the database.
     * @param {DocumentUpdateManyAndReturnArgs} args - Arguments to update many Documents.
     * @example
     * // Update many Documents
     * const document = await prisma.document.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Documents and only return the `id`
     * const documentWithIdOnly = await prisma.document.updateManyAndReturn({
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
    updateManyAndReturn<T extends DocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, DocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Document.
     * @param {DocumentUpsertArgs} args - Arguments to update or create a Document.
     * @example
     * // Update or create a Document
     * const document = await prisma.document.upsert({
     *   create: {
     *     // ... data to create a Document
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Document we want to update
     *   }
     * })
     */
    upsert<T extends DocumentUpsertArgs>(args: SelectSubset<T, DocumentUpsertArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Documents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentCountArgs} args - Arguments to filter Documents to count.
     * @example
     * // Count the number of Documents
     * const count = await prisma.document.count({
     *   where: {
     *     // ... the filter for the Documents we want to count
     *   }
     * })
    **/
    count<T extends DocumentCountArgs>(
      args?: Subset<T, DocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends DocumentAggregateArgs>(args: Subset<T, DocumentAggregateArgs>): Prisma.PrismaPromise<GetDocumentAggregateType<T>>

    /**
     * Group by Document.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DocumentGroupByArgs} args - Group by arguments.
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
      T extends DocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DocumentGroupByArgs['orderBy'] }
        : { orderBy?: DocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, DocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Document model
   */
  readonly fields: DocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Document.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    categoryDocuments<T extends Document$categoryDocumentsArgs<ExtArgs> = {}>(args?: Subset<T, Document$categoryDocumentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    subcategoryDocuments<T extends Document$subcategoryDocumentsArgs<ExtArgs> = {}>(args?: Subset<T, Document$subcategoryDocumentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Document model
   */
  interface DocumentFieldRefs {
    readonly id: FieldRef<"Document", 'String'>
    readonly name: FieldRef<"Document", 'String'>
    readonly category: FieldRef<"Document", 'String'>
    readonly description: FieldRef<"Document", 'String'>
    readonly hasExpiration: FieldRef<"Document", 'Boolean'>
    readonly createdAt: FieldRef<"Document", 'DateTime'>
    readonly updatedAt: FieldRef<"Document", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Document findUnique
   */
  export type DocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findUniqueOrThrow
   */
  export type DocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document findFirst
   */
  export type DocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findFirstOrThrow
   */
  export type DocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Document to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Documents.
     */
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document findMany
   */
  export type DocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter, which Documents to fetch.
     */
    where?: DocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Documents to fetch.
     */
    orderBy?: DocumentOrderByWithRelationInput | DocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Documents.
     */
    cursor?: DocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Documents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Documents.
     */
    skip?: number
    distinct?: DocumentScalarFieldEnum | DocumentScalarFieldEnum[]
  }

  /**
   * Document create
   */
  export type DocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to create a Document.
     */
    data: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
  }

  /**
   * Document createMany
   */
  export type DocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Document createManyAndReturn
   */
  export type DocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to create many Documents.
     */
    data: DocumentCreateManyInput | DocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Document update
   */
  export type DocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The data needed to update a Document.
     */
    data: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
    /**
     * Choose, which Document to update.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document updateMany
   */
  export type DocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
  }

  /**
   * Document updateManyAndReturn
   */
  export type DocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * The data used to update Documents.
     */
    data: XOR<DocumentUpdateManyMutationInput, DocumentUncheckedUpdateManyInput>
    /**
     * Filter which Documents to update
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to update.
     */
    limit?: number
  }

  /**
   * Document upsert
   */
  export type DocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * The filter to search for the Document to update in case it exists.
     */
    where: DocumentWhereUniqueInput
    /**
     * In case the Document found by the `where` argument doesn't exist, create a new Document with this data.
     */
    create: XOR<DocumentCreateInput, DocumentUncheckedCreateInput>
    /**
     * In case the Document was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DocumentUpdateInput, DocumentUncheckedUpdateInput>
  }

  /**
   * Document delete
   */
  export type DocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
    /**
     * Filter which Document to delete.
     */
    where: DocumentWhereUniqueInput
  }

  /**
   * Document deleteMany
   */
  export type DocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Documents to delete
     */
    where?: DocumentWhereInput
    /**
     * Limit how many Documents to delete.
     */
    limit?: number
  }

  /**
   * Document.categoryDocuments
   */
  export type Document$categoryDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    where?: CategoryDocumentWhereInput
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    cursor?: CategoryDocumentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CategoryDocumentScalarFieldEnum | CategoryDocumentScalarFieldEnum[]
  }

  /**
   * Document.subcategoryDocuments
   */
  export type Document$subcategoryDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    where?: SubcategoryDocumentWhereInput
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    cursor?: SubcategoryDocumentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubcategoryDocumentScalarFieldEnum | SubcategoryDocumentScalarFieldEnum[]
  }

  /**
   * Document without action
   */
  export type DocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Document
     */
    select?: DocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Document
     */
    omit?: DocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: DocumentInclude<ExtArgs> | null
  }


  /**
   * Model Category
   */

  export type AggregateCategory = {
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  export type CategoryMinAggregateOutputType = {
    id: string | null
    name: string | null
    requiresQualification: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    requiresQualification: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CategoryCountAggregateOutputType = {
    id: number
    name: number
    requiresQualification: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CategoryMinAggregateInputType = {
    id?: true
    name?: true
    requiresQualification?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryMaxAggregateInputType = {
    id?: true
    name?: true
    requiresQualification?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CategoryCountAggregateInputType = {
    id?: true
    name?: true
    requiresQualification?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Category to aggregate.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Categories
    **/
    _count?: true | CategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryMaxAggregateInputType
  }

  export type GetCategoryAggregateType<T extends CategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategory[P]>
      : GetScalarType<T[P], AggregateCategory[P]>
  }




  export type CategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryWhereInput
    orderBy?: CategoryOrderByWithAggregationInput | CategoryOrderByWithAggregationInput[]
    by: CategoryScalarFieldEnum[] | CategoryScalarFieldEnum
    having?: CategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryCountAggregateInputType | true
    _min?: CategoryMinAggregateInputType
    _max?: CategoryMaxAggregateInputType
  }

  export type CategoryGroupByOutputType = {
    id: string
    name: string
    requiresQualification: boolean
    createdAt: Date
    updatedAt: Date
    _count: CategoryCountAggregateOutputType | null
    _min: CategoryMinAggregateOutputType | null
    _max: CategoryMaxAggregateOutputType | null
  }

  type GetCategoryGroupByPayload<T extends CategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryGroupByOutputType[P]>
        }
      >
    >


  export type CategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    requiresQualification?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    subcategories?: boolean | Category$subcategoriesArgs<ExtArgs>
    documents?: boolean | Category$documentsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["category"]>

  export type CategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    requiresQualification?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    requiresQualification?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["category"]>

  export type CategorySelectScalar = {
    id?: boolean
    name?: boolean
    requiresQualification?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "requiresQualification" | "createdAt" | "updatedAt", ExtArgs["result"]["category"]>
  export type CategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategories?: boolean | Category$subcategoriesArgs<ExtArgs>
    documents?: boolean | Category$documentsArgs<ExtArgs>
    _count?: boolean | CategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Category"
    objects: {
      subcategories: Prisma.$SubcategoryPayload<ExtArgs>[]
      documents: Prisma.$CategoryDocumentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      requiresQualification: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["category"]>
    composites: {}
  }

  type CategoryGetPayload<S extends boolean | null | undefined | CategoryDefaultArgs> = $Result.GetResult<Prisma.$CategoryPayload, S>

  type CategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryCountAggregateInputType | true
    }

  export interface CategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Category'], meta: { name: 'Category' } }
    /**
     * Find zero or one Category that matches the filter.
     * @param {CategoryFindUniqueArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryFindUniqueArgs>(args: SelectSubset<T, CategoryFindUniqueArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Category that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryFindUniqueOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryFindFirstArgs>(args?: SelectSubset<T, CategoryFindFirstArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Category that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindFirstOrThrowArgs} args - Arguments to find a Category
     * @example
     * // Get one Category
     * const category = await prisma.category.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Categories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Categories
     * const categories = await prisma.category.findMany()
     * 
     * // Get first 10 Categories
     * const categories = await prisma.category.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryWithIdOnly = await prisma.category.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryFindManyArgs>(args?: SelectSubset<T, CategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Category.
     * @param {CategoryCreateArgs} args - Arguments to create a Category.
     * @example
     * // Create one Category
     * const Category = await prisma.category.create({
     *   data: {
     *     // ... data to create a Category
     *   }
     * })
     * 
     */
    create<T extends CategoryCreateArgs>(args: SelectSubset<T, CategoryCreateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Categories.
     * @param {CategoryCreateManyArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryCreateManyArgs>(args?: SelectSubset<T, CategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Categories and returns the data saved in the database.
     * @param {CategoryCreateManyAndReturnArgs} args - Arguments to create many Categories.
     * @example
     * // Create many Categories
     * const category = await prisma.category.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Category.
     * @param {CategoryDeleteArgs} args - Arguments to delete one Category.
     * @example
     * // Delete one Category
     * const Category = await prisma.category.delete({
     *   where: {
     *     // ... filter to delete one Category
     *   }
     * })
     * 
     */
    delete<T extends CategoryDeleteArgs>(args: SelectSubset<T, CategoryDeleteArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Category.
     * @param {CategoryUpdateArgs} args - Arguments to update one Category.
     * @example
     * // Update one Category
     * const category = await prisma.category.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryUpdateArgs>(args: SelectSubset<T, CategoryUpdateArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Categories.
     * @param {CategoryDeleteManyArgs} args - Arguments to filter Categories to delete.
     * @example
     * // Delete a few Categories
     * const { count } = await prisma.category.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDeleteManyArgs>(args?: SelectSubset<T, CategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryUpdateManyArgs>(args: SelectSubset<T, CategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Categories and returns the data updated in the database.
     * @param {CategoryUpdateManyAndReturnArgs} args - Arguments to update many Categories.
     * @example
     * // Update many Categories
     * const category = await prisma.category.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Categories and only return the `id`
     * const categoryWithIdOnly = await prisma.category.updateManyAndReturn({
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
    updateManyAndReturn<T extends CategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Category.
     * @param {CategoryUpsertArgs} args - Arguments to update or create a Category.
     * @example
     * // Update or create a Category
     * const category = await prisma.category.upsert({
     *   create: {
     *     // ... data to create a Category
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Category we want to update
     *   }
     * })
     */
    upsert<T extends CategoryUpsertArgs>(args: SelectSubset<T, CategoryUpsertArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Categories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryCountArgs} args - Arguments to filter Categories to count.
     * @example
     * // Count the number of Categories
     * const count = await prisma.category.count({
     *   where: {
     *     // ... the filter for the Categories we want to count
     *   }
     * })
    **/
    count<T extends CategoryCountArgs>(
      args?: Subset<T, CategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CategoryAggregateArgs>(args: Subset<T, CategoryAggregateArgs>): Prisma.PrismaPromise<GetCategoryAggregateType<T>>

    /**
     * Group by Category.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryGroupByArgs} args - Group by arguments.
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
      T extends CategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryGroupByArgs['orderBy'] }
        : { orderBy?: CategoryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Category model
   */
  readonly fields: CategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Category.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    subcategories<T extends Category$subcategoriesArgs<ExtArgs> = {}>(args?: Subset<T, Category$subcategoriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    documents<T extends Category$documentsArgs<ExtArgs> = {}>(args?: Subset<T, Category$documentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Category model
   */
  interface CategoryFieldRefs {
    readonly id: FieldRef<"Category", 'String'>
    readonly name: FieldRef<"Category", 'String'>
    readonly requiresQualification: FieldRef<"Category", 'Boolean'>
    readonly createdAt: FieldRef<"Category", 'DateTime'>
    readonly updatedAt: FieldRef<"Category", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Category findUnique
   */
  export type CategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findUniqueOrThrow
   */
  export type CategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category findFirst
   */
  export type CategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findFirstOrThrow
   */
  export type CategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Category to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Categories.
     */
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category findMany
   */
  export type CategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter, which Categories to fetch.
     */
    where?: CategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Categories to fetch.
     */
    orderBy?: CategoryOrderByWithRelationInput | CategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Categories.
     */
    cursor?: CategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Categories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Categories.
     */
    skip?: number
    distinct?: CategoryScalarFieldEnum | CategoryScalarFieldEnum[]
  }

  /**
   * Category create
   */
  export type CategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Category.
     */
    data: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
  }

  /**
   * Category createMany
   */
  export type CategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category createManyAndReturn
   */
  export type CategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Categories.
     */
    data: CategoryCreateManyInput | CategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Category update
   */
  export type CategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Category.
     */
    data: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
    /**
     * Choose, which Category to update.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category updateMany
   */
  export type CategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category updateManyAndReturn
   */
  export type CategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * The data used to update Categories.
     */
    data: XOR<CategoryUpdateManyMutationInput, CategoryUncheckedUpdateManyInput>
    /**
     * Filter which Categories to update
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to update.
     */
    limit?: number
  }

  /**
   * Category upsert
   */
  export type CategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Category to update in case it exists.
     */
    where: CategoryWhereUniqueInput
    /**
     * In case the Category found by the `where` argument doesn't exist, create a new Category with this data.
     */
    create: XOR<CategoryCreateInput, CategoryUncheckedCreateInput>
    /**
     * In case the Category was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryUpdateInput, CategoryUncheckedUpdateInput>
  }

  /**
   * Category delete
   */
  export type CategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
    /**
     * Filter which Category to delete.
     */
    where: CategoryWhereUniqueInput
  }

  /**
   * Category deleteMany
   */
  export type CategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Categories to delete
     */
    where?: CategoryWhereInput
    /**
     * Limit how many Categories to delete.
     */
    limit?: number
  }

  /**
   * Category.subcategories
   */
  export type Category$subcategoriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    where?: SubcategoryWhereInput
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    cursor?: SubcategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Category.documents
   */
  export type Category$documentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    where?: CategoryDocumentWhereInput
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    cursor?: CategoryDocumentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CategoryDocumentScalarFieldEnum | CategoryDocumentScalarFieldEnum[]
  }

  /**
   * Category without action
   */
  export type CategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Category
     */
    select?: CategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Category
     */
    omit?: CategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryInclude<ExtArgs> | null
  }


  /**
   * Model Subcategory
   */

  export type AggregateSubcategory = {
    _count: SubcategoryCountAggregateOutputType | null
    _min: SubcategoryMinAggregateOutputType | null
    _max: SubcategoryMaxAggregateOutputType | null
  }

  export type SubcategoryMinAggregateOutputType = {
    id: string | null
    categoryId: string | null
    name: string | null
    requiresRegistration: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubcategoryMaxAggregateOutputType = {
    id: string | null
    categoryId: string | null
    name: string | null
    requiresRegistration: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubcategoryCountAggregateOutputType = {
    id: number
    categoryId: number
    name: number
    requiresRegistration: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubcategoryMinAggregateInputType = {
    id?: true
    categoryId?: true
    name?: true
    requiresRegistration?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubcategoryMaxAggregateInputType = {
    id?: true
    categoryId?: true
    name?: true
    requiresRegistration?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubcategoryCountAggregateInputType = {
    id?: true
    categoryId?: true
    name?: true
    requiresRegistration?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubcategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subcategory to aggregate.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subcategories
    **/
    _count?: true | SubcategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubcategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubcategoryMaxAggregateInputType
  }

  export type GetSubcategoryAggregateType<T extends SubcategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateSubcategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubcategory[P]>
      : GetScalarType<T[P], AggregateSubcategory[P]>
  }




  export type SubcategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryWhereInput
    orderBy?: SubcategoryOrderByWithAggregationInput | SubcategoryOrderByWithAggregationInput[]
    by: SubcategoryScalarFieldEnum[] | SubcategoryScalarFieldEnum
    having?: SubcategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubcategoryCountAggregateInputType | true
    _min?: SubcategoryMinAggregateInputType
    _max?: SubcategoryMaxAggregateInputType
  }

  export type SubcategoryGroupByOutputType = {
    id: string
    categoryId: string
    name: string
    requiresRegistration: string | null
    createdAt: Date
    updatedAt: Date
    _count: SubcategoryCountAggregateOutputType | null
    _min: SubcategoryMinAggregateOutputType | null
    _max: SubcategoryMaxAggregateOutputType | null
  }

  type GetSubcategoryGroupByPayload<T extends SubcategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubcategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubcategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubcategoryGroupByOutputType[P]>
            : GetScalarType<T[P], SubcategoryGroupByOutputType[P]>
        }
      >
    >


  export type SubcategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    name?: boolean
    requiresRegistration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    additionalDocuments?: boolean | Subcategory$additionalDocumentsArgs<ExtArgs>
    _count?: boolean | SubcategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    name?: boolean
    requiresRegistration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    name?: boolean
    requiresRegistration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategory"]>

  export type SubcategorySelectScalar = {
    id?: boolean
    categoryId?: boolean
    name?: boolean
    requiresRegistration?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubcategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "categoryId" | "name" | "requiresRegistration" | "createdAt" | "updatedAt", ExtArgs["result"]["subcategory"]>
  export type SubcategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    additionalDocuments?: boolean | Subcategory$additionalDocumentsArgs<ExtArgs>
    _count?: boolean | SubcategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SubcategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }
  export type SubcategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
  }

  export type $SubcategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subcategory"
    objects: {
      category: Prisma.$CategoryPayload<ExtArgs>
      additionalDocuments: Prisma.$SubcategoryDocumentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      categoryId: string
      name: string
      requiresRegistration: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subcategory"]>
    composites: {}
  }

  type SubcategoryGetPayload<S extends boolean | null | undefined | SubcategoryDefaultArgs> = $Result.GetResult<Prisma.$SubcategoryPayload, S>

  type SubcategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubcategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubcategoryCountAggregateInputType | true
    }

  export interface SubcategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subcategory'], meta: { name: 'Subcategory' } }
    /**
     * Find zero or one Subcategory that matches the filter.
     * @param {SubcategoryFindUniqueArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubcategoryFindUniqueArgs>(args: SelectSubset<T, SubcategoryFindUniqueArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subcategory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubcategoryFindUniqueOrThrowArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubcategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, SubcategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subcategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindFirstArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubcategoryFindFirstArgs>(args?: SelectSubset<T, SubcategoryFindFirstArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subcategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindFirstOrThrowArgs} args - Arguments to find a Subcategory
     * @example
     * // Get one Subcategory
     * const subcategory = await prisma.subcategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubcategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, SubcategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subcategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subcategories
     * const subcategories = await prisma.subcategory.findMany()
     * 
     * // Get first 10 Subcategories
     * const subcategories = await prisma.subcategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubcategoryFindManyArgs>(args?: SelectSubset<T, SubcategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subcategory.
     * @param {SubcategoryCreateArgs} args - Arguments to create a Subcategory.
     * @example
     * // Create one Subcategory
     * const Subcategory = await prisma.subcategory.create({
     *   data: {
     *     // ... data to create a Subcategory
     *   }
     * })
     * 
     */
    create<T extends SubcategoryCreateArgs>(args: SelectSubset<T, SubcategoryCreateArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subcategories.
     * @param {SubcategoryCreateManyArgs} args - Arguments to create many Subcategories.
     * @example
     * // Create many Subcategories
     * const subcategory = await prisma.subcategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubcategoryCreateManyArgs>(args?: SelectSubset<T, SubcategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subcategories and returns the data saved in the database.
     * @param {SubcategoryCreateManyAndReturnArgs} args - Arguments to create many Subcategories.
     * @example
     * // Create many Subcategories
     * const subcategory = await prisma.subcategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subcategories and only return the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubcategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, SubcategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subcategory.
     * @param {SubcategoryDeleteArgs} args - Arguments to delete one Subcategory.
     * @example
     * // Delete one Subcategory
     * const Subcategory = await prisma.subcategory.delete({
     *   where: {
     *     // ... filter to delete one Subcategory
     *   }
     * })
     * 
     */
    delete<T extends SubcategoryDeleteArgs>(args: SelectSubset<T, SubcategoryDeleteArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subcategory.
     * @param {SubcategoryUpdateArgs} args - Arguments to update one Subcategory.
     * @example
     * // Update one Subcategory
     * const subcategory = await prisma.subcategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubcategoryUpdateArgs>(args: SelectSubset<T, SubcategoryUpdateArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subcategories.
     * @param {SubcategoryDeleteManyArgs} args - Arguments to filter Subcategories to delete.
     * @example
     * // Delete a few Subcategories
     * const { count } = await prisma.subcategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubcategoryDeleteManyArgs>(args?: SelectSubset<T, SubcategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subcategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subcategories
     * const subcategory = await prisma.subcategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubcategoryUpdateManyArgs>(args: SelectSubset<T, SubcategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subcategories and returns the data updated in the database.
     * @param {SubcategoryUpdateManyAndReturnArgs} args - Arguments to update many Subcategories.
     * @example
     * // Update many Subcategories
     * const subcategory = await prisma.subcategory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subcategories and only return the `id`
     * const subcategoryWithIdOnly = await prisma.subcategory.updateManyAndReturn({
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
    updateManyAndReturn<T extends SubcategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, SubcategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subcategory.
     * @param {SubcategoryUpsertArgs} args - Arguments to update or create a Subcategory.
     * @example
     * // Update or create a Subcategory
     * const subcategory = await prisma.subcategory.upsert({
     *   create: {
     *     // ... data to create a Subcategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subcategory we want to update
     *   }
     * })
     */
    upsert<T extends SubcategoryUpsertArgs>(args: SelectSubset<T, SubcategoryUpsertArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subcategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryCountArgs} args - Arguments to filter Subcategories to count.
     * @example
     * // Count the number of Subcategories
     * const count = await prisma.subcategory.count({
     *   where: {
     *     // ... the filter for the Subcategories we want to count
     *   }
     * })
    **/
    count<T extends SubcategoryCountArgs>(
      args?: Subset<T, SubcategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubcategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subcategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SubcategoryAggregateArgs>(args: Subset<T, SubcategoryAggregateArgs>): Prisma.PrismaPromise<GetSubcategoryAggregateType<T>>

    /**
     * Group by Subcategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryGroupByArgs} args - Group by arguments.
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
      T extends SubcategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubcategoryGroupByArgs['orderBy'] }
        : { orderBy?: SubcategoryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SubcategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubcategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subcategory model
   */
  readonly fields: SubcategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subcategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubcategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends CategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CategoryDefaultArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    additionalDocuments<T extends Subcategory$additionalDocumentsArgs<ExtArgs> = {}>(args?: Subset<T, Subcategory$additionalDocumentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Subcategory model
   */
  interface SubcategoryFieldRefs {
    readonly id: FieldRef<"Subcategory", 'String'>
    readonly categoryId: FieldRef<"Subcategory", 'String'>
    readonly name: FieldRef<"Subcategory", 'String'>
    readonly requiresRegistration: FieldRef<"Subcategory", 'String'>
    readonly createdAt: FieldRef<"Subcategory", 'DateTime'>
    readonly updatedAt: FieldRef<"Subcategory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subcategory findUnique
   */
  export type SubcategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory findUniqueOrThrow
   */
  export type SubcategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory findFirst
   */
  export type SubcategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subcategories.
     */
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory findFirstOrThrow
   */
  export type SubcategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategory to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subcategories.
     */
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory findMany
   */
  export type SubcategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter, which Subcategories to fetch.
     */
    where?: SubcategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subcategories to fetch.
     */
    orderBy?: SubcategoryOrderByWithRelationInput | SubcategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subcategories.
     */
    cursor?: SubcategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subcategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subcategories.
     */
    skip?: number
    distinct?: SubcategoryScalarFieldEnum | SubcategoryScalarFieldEnum[]
  }

  /**
   * Subcategory create
   */
  export type SubcategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Subcategory.
     */
    data: XOR<SubcategoryCreateInput, SubcategoryUncheckedCreateInput>
  }

  /**
   * Subcategory createMany
   */
  export type SubcategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subcategories.
     */
    data: SubcategoryCreateManyInput | SubcategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subcategory createManyAndReturn
   */
  export type SubcategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * The data used to create many Subcategories.
     */
    data: SubcategoryCreateManyInput | SubcategoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subcategory update
   */
  export type SubcategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Subcategory.
     */
    data: XOR<SubcategoryUpdateInput, SubcategoryUncheckedUpdateInput>
    /**
     * Choose, which Subcategory to update.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory updateMany
   */
  export type SubcategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subcategories.
     */
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyInput>
    /**
     * Filter which Subcategories to update
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to update.
     */
    limit?: number
  }

  /**
   * Subcategory updateManyAndReturn
   */
  export type SubcategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * The data used to update Subcategories.
     */
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyInput>
    /**
     * Filter which Subcategories to update
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subcategory upsert
   */
  export type SubcategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Subcategory to update in case it exists.
     */
    where: SubcategoryWhereUniqueInput
    /**
     * In case the Subcategory found by the `where` argument doesn't exist, create a new Subcategory with this data.
     */
    create: XOR<SubcategoryCreateInput, SubcategoryUncheckedCreateInput>
    /**
     * In case the Subcategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubcategoryUpdateInput, SubcategoryUncheckedUpdateInput>
  }

  /**
   * Subcategory delete
   */
  export type SubcategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
    /**
     * Filter which Subcategory to delete.
     */
    where: SubcategoryWhereUniqueInput
  }

  /**
   * Subcategory deleteMany
   */
  export type SubcategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subcategories to delete
     */
    where?: SubcategoryWhereInput
    /**
     * Limit how many Subcategories to delete.
     */
    limit?: number
  }

  /**
   * Subcategory.additionalDocuments
   */
  export type Subcategory$additionalDocumentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    where?: SubcategoryDocumentWhereInput
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    cursor?: SubcategoryDocumentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SubcategoryDocumentScalarFieldEnum | SubcategoryDocumentScalarFieldEnum[]
  }

  /**
   * Subcategory without action
   */
  export type SubcategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subcategory
     */
    select?: SubcategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subcategory
     */
    omit?: SubcategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryInclude<ExtArgs> | null
  }


  /**
   * Model CategoryDocument
   */

  export type AggregateCategoryDocument = {
    _count: CategoryDocumentCountAggregateOutputType | null
    _min: CategoryDocumentMinAggregateOutputType | null
    _max: CategoryDocumentMaxAggregateOutputType | null
  }

  export type CategoryDocumentMinAggregateOutputType = {
    id: string | null
    categoryId: string | null
    documentId: string | null
    documentType: string | null
    conditionKey: string | null
    requiredIfTrue: boolean | null
    createdAt: Date | null
  }

  export type CategoryDocumentMaxAggregateOutputType = {
    id: string | null
    categoryId: string | null
    documentId: string | null
    documentType: string | null
    conditionKey: string | null
    requiredIfTrue: boolean | null
    createdAt: Date | null
  }

  export type CategoryDocumentCountAggregateOutputType = {
    id: number
    categoryId: number
    documentId: number
    documentType: number
    conditionKey: number
    requiredIfTrue: number
    createdAt: number
    _all: number
  }


  export type CategoryDocumentMinAggregateInputType = {
    id?: true
    categoryId?: true
    documentId?: true
    documentType?: true
    conditionKey?: true
    requiredIfTrue?: true
    createdAt?: true
  }

  export type CategoryDocumentMaxAggregateInputType = {
    id?: true
    categoryId?: true
    documentId?: true
    documentType?: true
    conditionKey?: true
    requiredIfTrue?: true
    createdAt?: true
  }

  export type CategoryDocumentCountAggregateInputType = {
    id?: true
    categoryId?: true
    documentId?: true
    documentType?: true
    conditionKey?: true
    requiredIfTrue?: true
    createdAt?: true
    _all?: true
  }

  export type CategoryDocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategoryDocument to aggregate.
     */
    where?: CategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDocuments to fetch.
     */
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CategoryDocuments
    **/
    _count?: true | CategoryDocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CategoryDocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CategoryDocumentMaxAggregateInputType
  }

  export type GetCategoryDocumentAggregateType<T extends CategoryDocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateCategoryDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCategoryDocument[P]>
      : GetScalarType<T[P], AggregateCategoryDocument[P]>
  }




  export type CategoryDocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CategoryDocumentWhereInput
    orderBy?: CategoryDocumentOrderByWithAggregationInput | CategoryDocumentOrderByWithAggregationInput[]
    by: CategoryDocumentScalarFieldEnum[] | CategoryDocumentScalarFieldEnum
    having?: CategoryDocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CategoryDocumentCountAggregateInputType | true
    _min?: CategoryDocumentMinAggregateInputType
    _max?: CategoryDocumentMaxAggregateInputType
  }

  export type CategoryDocumentGroupByOutputType = {
    id: string
    categoryId: string
    documentId: string
    documentType: string
    conditionKey: string | null
    requiredIfTrue: boolean | null
    createdAt: Date
    _count: CategoryDocumentCountAggregateOutputType | null
    _min: CategoryDocumentMinAggregateOutputType | null
    _max: CategoryDocumentMaxAggregateOutputType | null
  }

  type GetCategoryDocumentGroupByPayload<T extends CategoryDocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CategoryDocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CategoryDocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CategoryDocumentGroupByOutputType[P]>
            : GetScalarType<T[P], CategoryDocumentGroupByOutputType[P]>
        }
      >
    >


  export type CategoryDocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    documentId?: boolean
    documentType?: boolean
    conditionKey?: boolean
    requiredIfTrue?: boolean
    createdAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["categoryDocument"]>

  export type CategoryDocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    documentId?: boolean
    documentType?: boolean
    conditionKey?: boolean
    requiredIfTrue?: boolean
    createdAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["categoryDocument"]>

  export type CategoryDocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    categoryId?: boolean
    documentId?: boolean
    documentType?: boolean
    conditionKey?: boolean
    requiredIfTrue?: boolean
    createdAt?: boolean
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["categoryDocument"]>

  export type CategoryDocumentSelectScalar = {
    id?: boolean
    categoryId?: boolean
    documentId?: boolean
    documentType?: boolean
    conditionKey?: boolean
    requiredIfTrue?: boolean
    createdAt?: boolean
  }

  export type CategoryDocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "categoryId" | "documentId" | "documentType" | "conditionKey" | "requiredIfTrue" | "createdAt", ExtArgs["result"]["categoryDocument"]>
  export type CategoryDocumentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type CategoryDocumentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type CategoryDocumentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    category?: boolean | CategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }

  export type $CategoryDocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CategoryDocument"
    objects: {
      category: Prisma.$CategoryPayload<ExtArgs>
      document: Prisma.$DocumentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      categoryId: string
      documentId: string
      documentType: string
      conditionKey: string | null
      requiredIfTrue: boolean | null
      createdAt: Date
    }, ExtArgs["result"]["categoryDocument"]>
    composites: {}
  }

  type CategoryDocumentGetPayload<S extends boolean | null | undefined | CategoryDocumentDefaultArgs> = $Result.GetResult<Prisma.$CategoryDocumentPayload, S>

  type CategoryDocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CategoryDocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CategoryDocumentCountAggregateInputType | true
    }

  export interface CategoryDocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CategoryDocument'], meta: { name: 'CategoryDocument' } }
    /**
     * Find zero or one CategoryDocument that matches the filter.
     * @param {CategoryDocumentFindUniqueArgs} args - Arguments to find a CategoryDocument
     * @example
     * // Get one CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CategoryDocumentFindUniqueArgs>(args: SelectSubset<T, CategoryDocumentFindUniqueArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CategoryDocument that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CategoryDocumentFindUniqueOrThrowArgs} args - Arguments to find a CategoryDocument
     * @example
     * // Get one CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CategoryDocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, CategoryDocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategoryDocument that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentFindFirstArgs} args - Arguments to find a CategoryDocument
     * @example
     * // Get one CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CategoryDocumentFindFirstArgs>(args?: SelectSubset<T, CategoryDocumentFindFirstArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CategoryDocument that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentFindFirstOrThrowArgs} args - Arguments to find a CategoryDocument
     * @example
     * // Get one CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CategoryDocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, CategoryDocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CategoryDocuments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CategoryDocuments
     * const categoryDocuments = await prisma.categoryDocument.findMany()
     * 
     * // Get first 10 CategoryDocuments
     * const categoryDocuments = await prisma.categoryDocument.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const categoryDocumentWithIdOnly = await prisma.categoryDocument.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CategoryDocumentFindManyArgs>(args?: SelectSubset<T, CategoryDocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CategoryDocument.
     * @param {CategoryDocumentCreateArgs} args - Arguments to create a CategoryDocument.
     * @example
     * // Create one CategoryDocument
     * const CategoryDocument = await prisma.categoryDocument.create({
     *   data: {
     *     // ... data to create a CategoryDocument
     *   }
     * })
     * 
     */
    create<T extends CategoryDocumentCreateArgs>(args: SelectSubset<T, CategoryDocumentCreateArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CategoryDocuments.
     * @param {CategoryDocumentCreateManyArgs} args - Arguments to create many CategoryDocuments.
     * @example
     * // Create many CategoryDocuments
     * const categoryDocument = await prisma.categoryDocument.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CategoryDocumentCreateManyArgs>(args?: SelectSubset<T, CategoryDocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CategoryDocuments and returns the data saved in the database.
     * @param {CategoryDocumentCreateManyAndReturnArgs} args - Arguments to create many CategoryDocuments.
     * @example
     * // Create many CategoryDocuments
     * const categoryDocument = await prisma.categoryDocument.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CategoryDocuments and only return the `id`
     * const categoryDocumentWithIdOnly = await prisma.categoryDocument.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CategoryDocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, CategoryDocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CategoryDocument.
     * @param {CategoryDocumentDeleteArgs} args - Arguments to delete one CategoryDocument.
     * @example
     * // Delete one CategoryDocument
     * const CategoryDocument = await prisma.categoryDocument.delete({
     *   where: {
     *     // ... filter to delete one CategoryDocument
     *   }
     * })
     * 
     */
    delete<T extends CategoryDocumentDeleteArgs>(args: SelectSubset<T, CategoryDocumentDeleteArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CategoryDocument.
     * @param {CategoryDocumentUpdateArgs} args - Arguments to update one CategoryDocument.
     * @example
     * // Update one CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CategoryDocumentUpdateArgs>(args: SelectSubset<T, CategoryDocumentUpdateArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CategoryDocuments.
     * @param {CategoryDocumentDeleteManyArgs} args - Arguments to filter CategoryDocuments to delete.
     * @example
     * // Delete a few CategoryDocuments
     * const { count } = await prisma.categoryDocument.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CategoryDocumentDeleteManyArgs>(args?: SelectSubset<T, CategoryDocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategoryDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CategoryDocuments
     * const categoryDocument = await prisma.categoryDocument.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CategoryDocumentUpdateManyArgs>(args: SelectSubset<T, CategoryDocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CategoryDocuments and returns the data updated in the database.
     * @param {CategoryDocumentUpdateManyAndReturnArgs} args - Arguments to update many CategoryDocuments.
     * @example
     * // Update many CategoryDocuments
     * const categoryDocument = await prisma.categoryDocument.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CategoryDocuments and only return the `id`
     * const categoryDocumentWithIdOnly = await prisma.categoryDocument.updateManyAndReturn({
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
    updateManyAndReturn<T extends CategoryDocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, CategoryDocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CategoryDocument.
     * @param {CategoryDocumentUpsertArgs} args - Arguments to update or create a CategoryDocument.
     * @example
     * // Update or create a CategoryDocument
     * const categoryDocument = await prisma.categoryDocument.upsert({
     *   create: {
     *     // ... data to create a CategoryDocument
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CategoryDocument we want to update
     *   }
     * })
     */
    upsert<T extends CategoryDocumentUpsertArgs>(args: SelectSubset<T, CategoryDocumentUpsertArgs<ExtArgs>>): Prisma__CategoryDocumentClient<$Result.GetResult<Prisma.$CategoryDocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CategoryDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentCountArgs} args - Arguments to filter CategoryDocuments to count.
     * @example
     * // Count the number of CategoryDocuments
     * const count = await prisma.categoryDocument.count({
     *   where: {
     *     // ... the filter for the CategoryDocuments we want to count
     *   }
     * })
    **/
    count<T extends CategoryDocumentCountArgs>(
      args?: Subset<T, CategoryDocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CategoryDocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CategoryDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CategoryDocumentAggregateArgs>(args: Subset<T, CategoryDocumentAggregateArgs>): Prisma.PrismaPromise<GetCategoryDocumentAggregateType<T>>

    /**
     * Group by CategoryDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CategoryDocumentGroupByArgs} args - Group by arguments.
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
      T extends CategoryDocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CategoryDocumentGroupByArgs['orderBy'] }
        : { orderBy?: CategoryDocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CategoryDocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCategoryDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CategoryDocument model
   */
  readonly fields: CategoryDocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CategoryDocument.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CategoryDocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    category<T extends CategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CategoryDefaultArgs<ExtArgs>>): Prisma__CategoryClient<$Result.GetResult<Prisma.$CategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    document<T extends DocumentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DocumentDefaultArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the CategoryDocument model
   */
  interface CategoryDocumentFieldRefs {
    readonly id: FieldRef<"CategoryDocument", 'String'>
    readonly categoryId: FieldRef<"CategoryDocument", 'String'>
    readonly documentId: FieldRef<"CategoryDocument", 'String'>
    readonly documentType: FieldRef<"CategoryDocument", 'String'>
    readonly conditionKey: FieldRef<"CategoryDocument", 'String'>
    readonly requiredIfTrue: FieldRef<"CategoryDocument", 'Boolean'>
    readonly createdAt: FieldRef<"CategoryDocument", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CategoryDocument findUnique
   */
  export type CategoryDocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which CategoryDocument to fetch.
     */
    where: CategoryDocumentWhereUniqueInput
  }

  /**
   * CategoryDocument findUniqueOrThrow
   */
  export type CategoryDocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which CategoryDocument to fetch.
     */
    where: CategoryDocumentWhereUniqueInput
  }

  /**
   * CategoryDocument findFirst
   */
  export type CategoryDocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which CategoryDocument to fetch.
     */
    where?: CategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDocuments to fetch.
     */
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategoryDocuments.
     */
    cursor?: CategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategoryDocuments.
     */
    distinct?: CategoryDocumentScalarFieldEnum | CategoryDocumentScalarFieldEnum[]
  }

  /**
   * CategoryDocument findFirstOrThrow
   */
  export type CategoryDocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which CategoryDocument to fetch.
     */
    where?: CategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDocuments to fetch.
     */
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CategoryDocuments.
     */
    cursor?: CategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CategoryDocuments.
     */
    distinct?: CategoryDocumentScalarFieldEnum | CategoryDocumentScalarFieldEnum[]
  }

  /**
   * CategoryDocument findMany
   */
  export type CategoryDocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which CategoryDocuments to fetch.
     */
    where?: CategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CategoryDocuments to fetch.
     */
    orderBy?: CategoryDocumentOrderByWithRelationInput | CategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CategoryDocuments.
     */
    cursor?: CategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CategoryDocuments.
     */
    skip?: number
    distinct?: CategoryDocumentScalarFieldEnum | CategoryDocumentScalarFieldEnum[]
  }

  /**
   * CategoryDocument create
   */
  export type CategoryDocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * The data needed to create a CategoryDocument.
     */
    data: XOR<CategoryDocumentCreateInput, CategoryDocumentUncheckedCreateInput>
  }

  /**
   * CategoryDocument createMany
   */
  export type CategoryDocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CategoryDocuments.
     */
    data: CategoryDocumentCreateManyInput | CategoryDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CategoryDocument createManyAndReturn
   */
  export type CategoryDocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * The data used to create many CategoryDocuments.
     */
    data: CategoryDocumentCreateManyInput | CategoryDocumentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CategoryDocument update
   */
  export type CategoryDocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * The data needed to update a CategoryDocument.
     */
    data: XOR<CategoryDocumentUpdateInput, CategoryDocumentUncheckedUpdateInput>
    /**
     * Choose, which CategoryDocument to update.
     */
    where: CategoryDocumentWhereUniqueInput
  }

  /**
   * CategoryDocument updateMany
   */
  export type CategoryDocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CategoryDocuments.
     */
    data: XOR<CategoryDocumentUpdateManyMutationInput, CategoryDocumentUncheckedUpdateManyInput>
    /**
     * Filter which CategoryDocuments to update
     */
    where?: CategoryDocumentWhereInput
    /**
     * Limit how many CategoryDocuments to update.
     */
    limit?: number
  }

  /**
   * CategoryDocument updateManyAndReturn
   */
  export type CategoryDocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * The data used to update CategoryDocuments.
     */
    data: XOR<CategoryDocumentUpdateManyMutationInput, CategoryDocumentUncheckedUpdateManyInput>
    /**
     * Filter which CategoryDocuments to update
     */
    where?: CategoryDocumentWhereInput
    /**
     * Limit how many CategoryDocuments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CategoryDocument upsert
   */
  export type CategoryDocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * The filter to search for the CategoryDocument to update in case it exists.
     */
    where: CategoryDocumentWhereUniqueInput
    /**
     * In case the CategoryDocument found by the `where` argument doesn't exist, create a new CategoryDocument with this data.
     */
    create: XOR<CategoryDocumentCreateInput, CategoryDocumentUncheckedCreateInput>
    /**
     * In case the CategoryDocument was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CategoryDocumentUpdateInput, CategoryDocumentUncheckedUpdateInput>
  }

  /**
   * CategoryDocument delete
   */
  export type CategoryDocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter which CategoryDocument to delete.
     */
    where: CategoryDocumentWhereUniqueInput
  }

  /**
   * CategoryDocument deleteMany
   */
  export type CategoryDocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CategoryDocuments to delete
     */
    where?: CategoryDocumentWhereInput
    /**
     * Limit how many CategoryDocuments to delete.
     */
    limit?: number
  }

  /**
   * CategoryDocument without action
   */
  export type CategoryDocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CategoryDocument
     */
    select?: CategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CategoryDocument
     */
    omit?: CategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CategoryDocumentInclude<ExtArgs> | null
  }


  /**
   * Model SubcategoryDocument
   */

  export type AggregateSubcategoryDocument = {
    _count: SubcategoryDocumentCountAggregateOutputType | null
    _min: SubcategoryDocumentMinAggregateOutputType | null
    _max: SubcategoryDocumentMaxAggregateOutputType | null
  }

  export type SubcategoryDocumentMinAggregateOutputType = {
    id: string | null
    subcategoryId: string | null
    documentId: string | null
    createdAt: Date | null
  }

  export type SubcategoryDocumentMaxAggregateOutputType = {
    id: string | null
    subcategoryId: string | null
    documentId: string | null
    createdAt: Date | null
  }

  export type SubcategoryDocumentCountAggregateOutputType = {
    id: number
    subcategoryId: number
    documentId: number
    createdAt: number
    _all: number
  }


  export type SubcategoryDocumentMinAggregateInputType = {
    id?: true
    subcategoryId?: true
    documentId?: true
    createdAt?: true
  }

  export type SubcategoryDocumentMaxAggregateInputType = {
    id?: true
    subcategoryId?: true
    documentId?: true
    createdAt?: true
  }

  export type SubcategoryDocumentCountAggregateInputType = {
    id?: true
    subcategoryId?: true
    documentId?: true
    createdAt?: true
    _all?: true
  }

  export type SubcategoryDocumentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SubcategoryDocument to aggregate.
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SubcategoryDocuments to fetch.
     */
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubcategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SubcategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SubcategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SubcategoryDocuments
    **/
    _count?: true | SubcategoryDocumentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubcategoryDocumentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubcategoryDocumentMaxAggregateInputType
  }

  export type GetSubcategoryDocumentAggregateType<T extends SubcategoryDocumentAggregateArgs> = {
        [P in keyof T & keyof AggregateSubcategoryDocument]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubcategoryDocument[P]>
      : GetScalarType<T[P], AggregateSubcategoryDocument[P]>
  }




  export type SubcategoryDocumentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubcategoryDocumentWhereInput
    orderBy?: SubcategoryDocumentOrderByWithAggregationInput | SubcategoryDocumentOrderByWithAggregationInput[]
    by: SubcategoryDocumentScalarFieldEnum[] | SubcategoryDocumentScalarFieldEnum
    having?: SubcategoryDocumentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubcategoryDocumentCountAggregateInputType | true
    _min?: SubcategoryDocumentMinAggregateInputType
    _max?: SubcategoryDocumentMaxAggregateInputType
  }

  export type SubcategoryDocumentGroupByOutputType = {
    id: string
    subcategoryId: string
    documentId: string
    createdAt: Date
    _count: SubcategoryDocumentCountAggregateOutputType | null
    _min: SubcategoryDocumentMinAggregateOutputType | null
    _max: SubcategoryDocumentMaxAggregateOutputType | null
  }

  type GetSubcategoryDocumentGroupByPayload<T extends SubcategoryDocumentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubcategoryDocumentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubcategoryDocumentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubcategoryDocumentGroupByOutputType[P]>
            : GetScalarType<T[P], SubcategoryDocumentGroupByOutputType[P]>
        }
      >
    >


  export type SubcategoryDocumentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    subcategoryId?: boolean
    documentId?: boolean
    createdAt?: boolean
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategoryDocument"]>

  export type SubcategoryDocumentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    subcategoryId?: boolean
    documentId?: boolean
    createdAt?: boolean
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategoryDocument"]>

  export type SubcategoryDocumentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    subcategoryId?: boolean
    documentId?: boolean
    createdAt?: boolean
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subcategoryDocument"]>

  export type SubcategoryDocumentSelectScalar = {
    id?: boolean
    subcategoryId?: boolean
    documentId?: boolean
    createdAt?: boolean
  }

  export type SubcategoryDocumentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "subcategoryId" | "documentId" | "createdAt", ExtArgs["result"]["subcategoryDocument"]>
  export type SubcategoryDocumentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type SubcategoryDocumentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }
  export type SubcategoryDocumentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    subcategory?: boolean | SubcategoryDefaultArgs<ExtArgs>
    document?: boolean | DocumentDefaultArgs<ExtArgs>
  }

  export type $SubcategoryDocumentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SubcategoryDocument"
    objects: {
      subcategory: Prisma.$SubcategoryPayload<ExtArgs>
      document: Prisma.$DocumentPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      subcategoryId: string
      documentId: string
      createdAt: Date
    }, ExtArgs["result"]["subcategoryDocument"]>
    composites: {}
  }

  type SubcategoryDocumentGetPayload<S extends boolean | null | undefined | SubcategoryDocumentDefaultArgs> = $Result.GetResult<Prisma.$SubcategoryDocumentPayload, S>

  type SubcategoryDocumentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubcategoryDocumentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubcategoryDocumentCountAggregateInputType | true
    }

  export interface SubcategoryDocumentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SubcategoryDocument'], meta: { name: 'SubcategoryDocument' } }
    /**
     * Find zero or one SubcategoryDocument that matches the filter.
     * @param {SubcategoryDocumentFindUniqueArgs} args - Arguments to find a SubcategoryDocument
     * @example
     * // Get one SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubcategoryDocumentFindUniqueArgs>(args: SelectSubset<T, SubcategoryDocumentFindUniqueArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SubcategoryDocument that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubcategoryDocumentFindUniqueOrThrowArgs} args - Arguments to find a SubcategoryDocument
     * @example
     * // Get one SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubcategoryDocumentFindUniqueOrThrowArgs>(args: SelectSubset<T, SubcategoryDocumentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SubcategoryDocument that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentFindFirstArgs} args - Arguments to find a SubcategoryDocument
     * @example
     * // Get one SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubcategoryDocumentFindFirstArgs>(args?: SelectSubset<T, SubcategoryDocumentFindFirstArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SubcategoryDocument that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentFindFirstOrThrowArgs} args - Arguments to find a SubcategoryDocument
     * @example
     * // Get one SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubcategoryDocumentFindFirstOrThrowArgs>(args?: SelectSubset<T, SubcategoryDocumentFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SubcategoryDocuments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SubcategoryDocuments
     * const subcategoryDocuments = await prisma.subcategoryDocument.findMany()
     * 
     * // Get first 10 SubcategoryDocuments
     * const subcategoryDocuments = await prisma.subcategoryDocument.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subcategoryDocumentWithIdOnly = await prisma.subcategoryDocument.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubcategoryDocumentFindManyArgs>(args?: SelectSubset<T, SubcategoryDocumentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SubcategoryDocument.
     * @param {SubcategoryDocumentCreateArgs} args - Arguments to create a SubcategoryDocument.
     * @example
     * // Create one SubcategoryDocument
     * const SubcategoryDocument = await prisma.subcategoryDocument.create({
     *   data: {
     *     // ... data to create a SubcategoryDocument
     *   }
     * })
     * 
     */
    create<T extends SubcategoryDocumentCreateArgs>(args: SelectSubset<T, SubcategoryDocumentCreateArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SubcategoryDocuments.
     * @param {SubcategoryDocumentCreateManyArgs} args - Arguments to create many SubcategoryDocuments.
     * @example
     * // Create many SubcategoryDocuments
     * const subcategoryDocument = await prisma.subcategoryDocument.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubcategoryDocumentCreateManyArgs>(args?: SelectSubset<T, SubcategoryDocumentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SubcategoryDocuments and returns the data saved in the database.
     * @param {SubcategoryDocumentCreateManyAndReturnArgs} args - Arguments to create many SubcategoryDocuments.
     * @example
     * // Create many SubcategoryDocuments
     * const subcategoryDocument = await prisma.subcategoryDocument.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SubcategoryDocuments and only return the `id`
     * const subcategoryDocumentWithIdOnly = await prisma.subcategoryDocument.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubcategoryDocumentCreateManyAndReturnArgs>(args?: SelectSubset<T, SubcategoryDocumentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SubcategoryDocument.
     * @param {SubcategoryDocumentDeleteArgs} args - Arguments to delete one SubcategoryDocument.
     * @example
     * // Delete one SubcategoryDocument
     * const SubcategoryDocument = await prisma.subcategoryDocument.delete({
     *   where: {
     *     // ... filter to delete one SubcategoryDocument
     *   }
     * })
     * 
     */
    delete<T extends SubcategoryDocumentDeleteArgs>(args: SelectSubset<T, SubcategoryDocumentDeleteArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SubcategoryDocument.
     * @param {SubcategoryDocumentUpdateArgs} args - Arguments to update one SubcategoryDocument.
     * @example
     * // Update one SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubcategoryDocumentUpdateArgs>(args: SelectSubset<T, SubcategoryDocumentUpdateArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SubcategoryDocuments.
     * @param {SubcategoryDocumentDeleteManyArgs} args - Arguments to filter SubcategoryDocuments to delete.
     * @example
     * // Delete a few SubcategoryDocuments
     * const { count } = await prisma.subcategoryDocument.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubcategoryDocumentDeleteManyArgs>(args?: SelectSubset<T, SubcategoryDocumentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SubcategoryDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SubcategoryDocuments
     * const subcategoryDocument = await prisma.subcategoryDocument.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubcategoryDocumentUpdateManyArgs>(args: SelectSubset<T, SubcategoryDocumentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SubcategoryDocuments and returns the data updated in the database.
     * @param {SubcategoryDocumentUpdateManyAndReturnArgs} args - Arguments to update many SubcategoryDocuments.
     * @example
     * // Update many SubcategoryDocuments
     * const subcategoryDocument = await prisma.subcategoryDocument.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SubcategoryDocuments and only return the `id`
     * const subcategoryDocumentWithIdOnly = await prisma.subcategoryDocument.updateManyAndReturn({
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
    updateManyAndReturn<T extends SubcategoryDocumentUpdateManyAndReturnArgs>(args: SelectSubset<T, SubcategoryDocumentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SubcategoryDocument.
     * @param {SubcategoryDocumentUpsertArgs} args - Arguments to update or create a SubcategoryDocument.
     * @example
     * // Update or create a SubcategoryDocument
     * const subcategoryDocument = await prisma.subcategoryDocument.upsert({
     *   create: {
     *     // ... data to create a SubcategoryDocument
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SubcategoryDocument we want to update
     *   }
     * })
     */
    upsert<T extends SubcategoryDocumentUpsertArgs>(args: SelectSubset<T, SubcategoryDocumentUpsertArgs<ExtArgs>>): Prisma__SubcategoryDocumentClient<$Result.GetResult<Prisma.$SubcategoryDocumentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SubcategoryDocuments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentCountArgs} args - Arguments to filter SubcategoryDocuments to count.
     * @example
     * // Count the number of SubcategoryDocuments
     * const count = await prisma.subcategoryDocument.count({
     *   where: {
     *     // ... the filter for the SubcategoryDocuments we want to count
     *   }
     * })
    **/
    count<T extends SubcategoryDocumentCountArgs>(
      args?: Subset<T, SubcategoryDocumentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubcategoryDocumentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SubcategoryDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SubcategoryDocumentAggregateArgs>(args: Subset<T, SubcategoryDocumentAggregateArgs>): Prisma.PrismaPromise<GetSubcategoryDocumentAggregateType<T>>

    /**
     * Group by SubcategoryDocument.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubcategoryDocumentGroupByArgs} args - Group by arguments.
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
      T extends SubcategoryDocumentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubcategoryDocumentGroupByArgs['orderBy'] }
        : { orderBy?: SubcategoryDocumentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SubcategoryDocumentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubcategoryDocumentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SubcategoryDocument model
   */
  readonly fields: SubcategoryDocumentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SubcategoryDocument.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubcategoryDocumentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    subcategory<T extends SubcategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SubcategoryDefaultArgs<ExtArgs>>): Prisma__SubcategoryClient<$Result.GetResult<Prisma.$SubcategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    document<T extends DocumentDefaultArgs<ExtArgs> = {}>(args?: Subset<T, DocumentDefaultArgs<ExtArgs>>): Prisma__DocumentClient<$Result.GetResult<Prisma.$DocumentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the SubcategoryDocument model
   */
  interface SubcategoryDocumentFieldRefs {
    readonly id: FieldRef<"SubcategoryDocument", 'String'>
    readonly subcategoryId: FieldRef<"SubcategoryDocument", 'String'>
    readonly documentId: FieldRef<"SubcategoryDocument", 'String'>
    readonly createdAt: FieldRef<"SubcategoryDocument", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SubcategoryDocument findUnique
   */
  export type SubcategoryDocumentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which SubcategoryDocument to fetch.
     */
    where: SubcategoryDocumentWhereUniqueInput
  }

  /**
   * SubcategoryDocument findUniqueOrThrow
   */
  export type SubcategoryDocumentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which SubcategoryDocument to fetch.
     */
    where: SubcategoryDocumentWhereUniqueInput
  }

  /**
   * SubcategoryDocument findFirst
   */
  export type SubcategoryDocumentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which SubcategoryDocument to fetch.
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SubcategoryDocuments to fetch.
     */
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SubcategoryDocuments.
     */
    cursor?: SubcategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SubcategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SubcategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SubcategoryDocuments.
     */
    distinct?: SubcategoryDocumentScalarFieldEnum | SubcategoryDocumentScalarFieldEnum[]
  }

  /**
   * SubcategoryDocument findFirstOrThrow
   */
  export type SubcategoryDocumentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which SubcategoryDocument to fetch.
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SubcategoryDocuments to fetch.
     */
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SubcategoryDocuments.
     */
    cursor?: SubcategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SubcategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SubcategoryDocuments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SubcategoryDocuments.
     */
    distinct?: SubcategoryDocumentScalarFieldEnum | SubcategoryDocumentScalarFieldEnum[]
  }

  /**
   * SubcategoryDocument findMany
   */
  export type SubcategoryDocumentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter, which SubcategoryDocuments to fetch.
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SubcategoryDocuments to fetch.
     */
    orderBy?: SubcategoryDocumentOrderByWithRelationInput | SubcategoryDocumentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SubcategoryDocuments.
     */
    cursor?: SubcategoryDocumentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SubcategoryDocuments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SubcategoryDocuments.
     */
    skip?: number
    distinct?: SubcategoryDocumentScalarFieldEnum | SubcategoryDocumentScalarFieldEnum[]
  }

  /**
   * SubcategoryDocument create
   */
  export type SubcategoryDocumentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * The data needed to create a SubcategoryDocument.
     */
    data: XOR<SubcategoryDocumentCreateInput, SubcategoryDocumentUncheckedCreateInput>
  }

  /**
   * SubcategoryDocument createMany
   */
  export type SubcategoryDocumentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SubcategoryDocuments.
     */
    data: SubcategoryDocumentCreateManyInput | SubcategoryDocumentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SubcategoryDocument createManyAndReturn
   */
  export type SubcategoryDocumentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * The data used to create many SubcategoryDocuments.
     */
    data: SubcategoryDocumentCreateManyInput | SubcategoryDocumentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SubcategoryDocument update
   */
  export type SubcategoryDocumentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * The data needed to update a SubcategoryDocument.
     */
    data: XOR<SubcategoryDocumentUpdateInput, SubcategoryDocumentUncheckedUpdateInput>
    /**
     * Choose, which SubcategoryDocument to update.
     */
    where: SubcategoryDocumentWhereUniqueInput
  }

  /**
   * SubcategoryDocument updateMany
   */
  export type SubcategoryDocumentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SubcategoryDocuments.
     */
    data: XOR<SubcategoryDocumentUpdateManyMutationInput, SubcategoryDocumentUncheckedUpdateManyInput>
    /**
     * Filter which SubcategoryDocuments to update
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * Limit how many SubcategoryDocuments to update.
     */
    limit?: number
  }

  /**
   * SubcategoryDocument updateManyAndReturn
   */
  export type SubcategoryDocumentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * The data used to update SubcategoryDocuments.
     */
    data: XOR<SubcategoryDocumentUpdateManyMutationInput, SubcategoryDocumentUncheckedUpdateManyInput>
    /**
     * Filter which SubcategoryDocuments to update
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * Limit how many SubcategoryDocuments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SubcategoryDocument upsert
   */
  export type SubcategoryDocumentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * The filter to search for the SubcategoryDocument to update in case it exists.
     */
    where: SubcategoryDocumentWhereUniqueInput
    /**
     * In case the SubcategoryDocument found by the `where` argument doesn't exist, create a new SubcategoryDocument with this data.
     */
    create: XOR<SubcategoryDocumentCreateInput, SubcategoryDocumentUncheckedCreateInput>
    /**
     * In case the SubcategoryDocument was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubcategoryDocumentUpdateInput, SubcategoryDocumentUncheckedUpdateInput>
  }

  /**
   * SubcategoryDocument delete
   */
  export type SubcategoryDocumentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
    /**
     * Filter which SubcategoryDocument to delete.
     */
    where: SubcategoryDocumentWhereUniqueInput
  }

  /**
   * SubcategoryDocument deleteMany
   */
  export type SubcategoryDocumentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SubcategoryDocuments to delete
     */
    where?: SubcategoryDocumentWhereInput
    /**
     * Limit how many SubcategoryDocuments to delete.
     */
    limit?: number
  }

  /**
   * SubcategoryDocument without action
   */
  export type SubcategoryDocumentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SubcategoryDocument
     */
    select?: SubcategoryDocumentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SubcategoryDocument
     */
    omit?: SubcategoryDocumentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubcategoryDocumentInclude<ExtArgs> | null
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


  export const DocumentScalarFieldEnum: {
    id: 'id',
    name: 'name',
    category: 'category',
    description: 'description',
    hasExpiration: 'hasExpiration',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DocumentScalarFieldEnum = (typeof DocumentScalarFieldEnum)[keyof typeof DocumentScalarFieldEnum]


  export const CategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    requiresQualification: 'requiresQualification',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CategoryScalarFieldEnum = (typeof CategoryScalarFieldEnum)[keyof typeof CategoryScalarFieldEnum]


  export const SubcategoryScalarFieldEnum: {
    id: 'id',
    categoryId: 'categoryId',
    name: 'name',
    requiresRegistration: 'requiresRegistration',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubcategoryScalarFieldEnum = (typeof SubcategoryScalarFieldEnum)[keyof typeof SubcategoryScalarFieldEnum]


  export const CategoryDocumentScalarFieldEnum: {
    id: 'id',
    categoryId: 'categoryId',
    documentId: 'documentId',
    documentType: 'documentType',
    conditionKey: 'conditionKey',
    requiredIfTrue: 'requiredIfTrue',
    createdAt: 'createdAt'
  };

  export type CategoryDocumentScalarFieldEnum = (typeof CategoryDocumentScalarFieldEnum)[keyof typeof CategoryDocumentScalarFieldEnum]


  export const SubcategoryDocumentScalarFieldEnum: {
    id: 'id',
    subcategoryId: 'subcategoryId',
    documentId: 'documentId',
    createdAt: 'createdAt'
  };

  export type SubcategoryDocumentScalarFieldEnum = (typeof SubcategoryDocumentScalarFieldEnum)[keyof typeof SubcategoryDocumentScalarFieldEnum]


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

  export type DocumentWhereInput = {
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    id?: StringFilter<"Document"> | string
    name?: StringFilter<"Document"> | string
    category?: StringFilter<"Document"> | string
    description?: StringFilter<"Document"> | string
    hasExpiration?: BoolFilter<"Document"> | boolean
    createdAt?: DateTimeFilter<"Document"> | Date | string
    updatedAt?: DateTimeFilter<"Document"> | Date | string
    categoryDocuments?: CategoryDocumentListRelationFilter
    subcategoryDocuments?: SubcategoryDocumentListRelationFilter
  }

  export type DocumentOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    description?: SortOrder
    hasExpiration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    categoryDocuments?: CategoryDocumentOrderByRelationAggregateInput
    subcategoryDocuments?: SubcategoryDocumentOrderByRelationAggregateInput
  }

  export type DocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: DocumentWhereInput | DocumentWhereInput[]
    OR?: DocumentWhereInput[]
    NOT?: DocumentWhereInput | DocumentWhereInput[]
    name?: StringFilter<"Document"> | string
    category?: StringFilter<"Document"> | string
    description?: StringFilter<"Document"> | string
    hasExpiration?: BoolFilter<"Document"> | boolean
    createdAt?: DateTimeFilter<"Document"> | Date | string
    updatedAt?: DateTimeFilter<"Document"> | Date | string
    categoryDocuments?: CategoryDocumentListRelationFilter
    subcategoryDocuments?: SubcategoryDocumentListRelationFilter
  }, "id">

  export type DocumentOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    description?: SortOrder
    hasExpiration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DocumentCountOrderByAggregateInput
    _max?: DocumentMaxOrderByAggregateInput
    _min?: DocumentMinOrderByAggregateInput
  }

  export type DocumentScalarWhereWithAggregatesInput = {
    AND?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    OR?: DocumentScalarWhereWithAggregatesInput[]
    NOT?: DocumentScalarWhereWithAggregatesInput | DocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Document"> | string
    name?: StringWithAggregatesFilter<"Document"> | string
    category?: StringWithAggregatesFilter<"Document"> | string
    description?: StringWithAggregatesFilter<"Document"> | string
    hasExpiration?: BoolWithAggregatesFilter<"Document"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Document"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Document"> | Date | string
  }

  export type CategoryWhereInput = {
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    id?: StringFilter<"Category"> | string
    name?: StringFilter<"Category"> | string
    requiresQualification?: BoolFilter<"Category"> | boolean
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    subcategories?: SubcategoryListRelationFilter
    documents?: CategoryDocumentListRelationFilter
  }

  export type CategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    requiresQualification?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    subcategories?: SubcategoryOrderByRelationAggregateInput
    documents?: CategoryDocumentOrderByRelationAggregateInput
  }

  export type CategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CategoryWhereInput | CategoryWhereInput[]
    OR?: CategoryWhereInput[]
    NOT?: CategoryWhereInput | CategoryWhereInput[]
    name?: StringFilter<"Category"> | string
    requiresQualification?: BoolFilter<"Category"> | boolean
    createdAt?: DateTimeFilter<"Category"> | Date | string
    updatedAt?: DateTimeFilter<"Category"> | Date | string
    subcategories?: SubcategoryListRelationFilter
    documents?: CategoryDocumentListRelationFilter
  }, "id">

  export type CategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    requiresQualification?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CategoryCountOrderByAggregateInput
    _max?: CategoryMaxOrderByAggregateInput
    _min?: CategoryMinOrderByAggregateInput
  }

  export type CategoryScalarWhereWithAggregatesInput = {
    AND?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    OR?: CategoryScalarWhereWithAggregatesInput[]
    NOT?: CategoryScalarWhereWithAggregatesInput | CategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Category"> | string
    name?: StringWithAggregatesFilter<"Category"> | string
    requiresQualification?: BoolWithAggregatesFilter<"Category"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Category"> | Date | string
  }

  export type SubcategoryWhereInput = {
    AND?: SubcategoryWhereInput | SubcategoryWhereInput[]
    OR?: SubcategoryWhereInput[]
    NOT?: SubcategoryWhereInput | SubcategoryWhereInput[]
    id?: StringFilter<"Subcategory"> | string
    categoryId?: StringFilter<"Subcategory"> | string
    name?: StringFilter<"Subcategory"> | string
    requiresRegistration?: StringNullableFilter<"Subcategory"> | string | null
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    additionalDocuments?: SubcategoryDocumentListRelationFilter
  }

  export type SubcategoryOrderByWithRelationInput = {
    id?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    requiresRegistration?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    category?: CategoryOrderByWithRelationInput
    additionalDocuments?: SubcategoryDocumentOrderByRelationAggregateInput
  }

  export type SubcategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SubcategoryWhereInput | SubcategoryWhereInput[]
    OR?: SubcategoryWhereInput[]
    NOT?: SubcategoryWhereInput | SubcategoryWhereInput[]
    categoryId?: StringFilter<"Subcategory"> | string
    name?: StringFilter<"Subcategory"> | string
    requiresRegistration?: StringNullableFilter<"Subcategory"> | string | null
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    additionalDocuments?: SubcategoryDocumentListRelationFilter
  }, "id">

  export type SubcategoryOrderByWithAggregationInput = {
    id?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    requiresRegistration?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubcategoryCountOrderByAggregateInput
    _max?: SubcategoryMaxOrderByAggregateInput
    _min?: SubcategoryMinOrderByAggregateInput
  }

  export type SubcategoryScalarWhereWithAggregatesInput = {
    AND?: SubcategoryScalarWhereWithAggregatesInput | SubcategoryScalarWhereWithAggregatesInput[]
    OR?: SubcategoryScalarWhereWithAggregatesInput[]
    NOT?: SubcategoryScalarWhereWithAggregatesInput | SubcategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subcategory"> | string
    categoryId?: StringWithAggregatesFilter<"Subcategory"> | string
    name?: StringWithAggregatesFilter<"Subcategory"> | string
    requiresRegistration?: StringNullableWithAggregatesFilter<"Subcategory"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subcategory"> | Date | string
  }

  export type CategoryDocumentWhereInput = {
    AND?: CategoryDocumentWhereInput | CategoryDocumentWhereInput[]
    OR?: CategoryDocumentWhereInput[]
    NOT?: CategoryDocumentWhereInput | CategoryDocumentWhereInput[]
    id?: StringFilter<"CategoryDocument"> | string
    categoryId?: StringFilter<"CategoryDocument"> | string
    documentId?: StringFilter<"CategoryDocument"> | string
    documentType?: StringFilter<"CategoryDocument"> | string
    conditionKey?: StringNullableFilter<"CategoryDocument"> | string | null
    requiredIfTrue?: BoolNullableFilter<"CategoryDocument"> | boolean | null
    createdAt?: DateTimeFilter<"CategoryDocument"> | Date | string
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }

  export type CategoryDocumentOrderByWithRelationInput = {
    id?: SortOrder
    categoryId?: SortOrder
    documentId?: SortOrder
    documentType?: SortOrder
    conditionKey?: SortOrderInput | SortOrder
    requiredIfTrue?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    category?: CategoryOrderByWithRelationInput
    document?: DocumentOrderByWithRelationInput
  }

  export type CategoryDocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    categoryId_documentId_documentType_conditionKey?: CategoryDocumentCategoryIdDocumentIdDocumentTypeConditionKeyCompoundUniqueInput
    AND?: CategoryDocumentWhereInput | CategoryDocumentWhereInput[]
    OR?: CategoryDocumentWhereInput[]
    NOT?: CategoryDocumentWhereInput | CategoryDocumentWhereInput[]
    categoryId?: StringFilter<"CategoryDocument"> | string
    documentId?: StringFilter<"CategoryDocument"> | string
    documentType?: StringFilter<"CategoryDocument"> | string
    conditionKey?: StringNullableFilter<"CategoryDocument"> | string | null
    requiredIfTrue?: BoolNullableFilter<"CategoryDocument"> | boolean | null
    createdAt?: DateTimeFilter<"CategoryDocument"> | Date | string
    category?: XOR<CategoryScalarRelationFilter, CategoryWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }, "id" | "categoryId_documentId_documentType_conditionKey">

  export type CategoryDocumentOrderByWithAggregationInput = {
    id?: SortOrder
    categoryId?: SortOrder
    documentId?: SortOrder
    documentType?: SortOrder
    conditionKey?: SortOrderInput | SortOrder
    requiredIfTrue?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CategoryDocumentCountOrderByAggregateInput
    _max?: CategoryDocumentMaxOrderByAggregateInput
    _min?: CategoryDocumentMinOrderByAggregateInput
  }

  export type CategoryDocumentScalarWhereWithAggregatesInput = {
    AND?: CategoryDocumentScalarWhereWithAggregatesInput | CategoryDocumentScalarWhereWithAggregatesInput[]
    OR?: CategoryDocumentScalarWhereWithAggregatesInput[]
    NOT?: CategoryDocumentScalarWhereWithAggregatesInput | CategoryDocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CategoryDocument"> | string
    categoryId?: StringWithAggregatesFilter<"CategoryDocument"> | string
    documentId?: StringWithAggregatesFilter<"CategoryDocument"> | string
    documentType?: StringWithAggregatesFilter<"CategoryDocument"> | string
    conditionKey?: StringNullableWithAggregatesFilter<"CategoryDocument"> | string | null
    requiredIfTrue?: BoolNullableWithAggregatesFilter<"CategoryDocument"> | boolean | null
    createdAt?: DateTimeWithAggregatesFilter<"CategoryDocument"> | Date | string
  }

  export type SubcategoryDocumentWhereInput = {
    AND?: SubcategoryDocumentWhereInput | SubcategoryDocumentWhereInput[]
    OR?: SubcategoryDocumentWhereInput[]
    NOT?: SubcategoryDocumentWhereInput | SubcategoryDocumentWhereInput[]
    id?: StringFilter<"SubcategoryDocument"> | string
    subcategoryId?: StringFilter<"SubcategoryDocument"> | string
    documentId?: StringFilter<"SubcategoryDocument"> | string
    createdAt?: DateTimeFilter<"SubcategoryDocument"> | Date | string
    subcategory?: XOR<SubcategoryScalarRelationFilter, SubcategoryWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }

  export type SubcategoryDocumentOrderByWithRelationInput = {
    id?: SortOrder
    subcategoryId?: SortOrder
    documentId?: SortOrder
    createdAt?: SortOrder
    subcategory?: SubcategoryOrderByWithRelationInput
    document?: DocumentOrderByWithRelationInput
  }

  export type SubcategoryDocumentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    subcategoryId_documentId?: SubcategoryDocumentSubcategoryIdDocumentIdCompoundUniqueInput
    AND?: SubcategoryDocumentWhereInput | SubcategoryDocumentWhereInput[]
    OR?: SubcategoryDocumentWhereInput[]
    NOT?: SubcategoryDocumentWhereInput | SubcategoryDocumentWhereInput[]
    subcategoryId?: StringFilter<"SubcategoryDocument"> | string
    documentId?: StringFilter<"SubcategoryDocument"> | string
    createdAt?: DateTimeFilter<"SubcategoryDocument"> | Date | string
    subcategory?: XOR<SubcategoryScalarRelationFilter, SubcategoryWhereInput>
    document?: XOR<DocumentScalarRelationFilter, DocumentWhereInput>
  }, "id" | "subcategoryId_documentId">

  export type SubcategoryDocumentOrderByWithAggregationInput = {
    id?: SortOrder
    subcategoryId?: SortOrder
    documentId?: SortOrder
    createdAt?: SortOrder
    _count?: SubcategoryDocumentCountOrderByAggregateInput
    _max?: SubcategoryDocumentMaxOrderByAggregateInput
    _min?: SubcategoryDocumentMinOrderByAggregateInput
  }

  export type SubcategoryDocumentScalarWhereWithAggregatesInput = {
    AND?: SubcategoryDocumentScalarWhereWithAggregatesInput | SubcategoryDocumentScalarWhereWithAggregatesInput[]
    OR?: SubcategoryDocumentScalarWhereWithAggregatesInput[]
    NOT?: SubcategoryDocumentScalarWhereWithAggregatesInput | SubcategoryDocumentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SubcategoryDocument"> | string
    subcategoryId?: StringWithAggregatesFilter<"SubcategoryDocument"> | string
    documentId?: StringWithAggregatesFilter<"SubcategoryDocument"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SubcategoryDocument"> | Date | string
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

  export type DocumentCreateInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryDocuments?: CategoryDocumentCreateNestedManyWithoutDocumentInput
    subcategoryDocuments?: SubcategoryDocumentCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryDocuments?: CategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput
    subcategoryDocuments?: SubcategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryDocuments?: CategoryDocumentUpdateManyWithoutDocumentNestedInput
    subcategoryDocuments?: SubcategoryDocumentUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryDocuments?: CategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput
    subcategoryDocuments?: SubcategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentCreateManyInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryCreateInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryCreateNestedManyWithoutCategoryInput
    documents?: CategoryDocumentCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutCategoryInput
    documents?: CategoryDocumentUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUpdateManyWithoutCategoryNestedInput
    documents?: CategoryDocumentUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput
    documents?: CategoryDocumentUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryCreateManyInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryCreateInput = {
    id: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    category: CategoryCreateNestedOneWithoutSubcategoriesInput
    additionalDocuments?: SubcategoryDocumentCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUncheckedCreateInput = {
    id: string
    categoryId: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    additionalDocuments?: SubcategoryDocumentUncheckedCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput
    additionalDocuments?: SubcategoryDocumentUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    additionalDocuments?: SubcategoryDocumentUncheckedUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryCreateManyInput = {
    id: string
    categoryId: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentCreateInput = {
    id?: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutDocumentsInput
    document: DocumentCreateNestedOneWithoutCategoryDocumentsInput
  }

  export type CategoryDocumentUncheckedCreateInput = {
    id?: string
    categoryId: string
    documentId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type CategoryDocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutDocumentsNestedInput
    document?: DocumentUpdateOneRequiredWithoutCategoryDocumentsNestedInput
  }

  export type CategoryDocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentCreateManyInput = {
    id?: string
    categoryId: string
    documentId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type CategoryDocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentCreateInput = {
    id?: string
    createdAt?: Date | string
    subcategory: SubcategoryCreateNestedOneWithoutAdditionalDocumentsInput
    document: DocumentCreateNestedOneWithoutSubcategoryDocumentsInput
  }

  export type SubcategoryDocumentUncheckedCreateInput = {
    id?: string
    subcategoryId: string
    documentId: string
    createdAt?: Date | string
  }

  export type SubcategoryDocumentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategory?: SubcategoryUpdateOneRequiredWithoutAdditionalDocumentsNestedInput
    document?: DocumentUpdateOneRequiredWithoutSubcategoryDocumentsNestedInput
  }

  export type SubcategoryDocumentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    subcategoryId?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentCreateManyInput = {
    id?: string
    subcategoryId: string
    documentId: string
    createdAt?: Date | string
  }

  export type SubcategoryDocumentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    subcategoryId?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
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

  export type CategoryDocumentListRelationFilter = {
    every?: CategoryDocumentWhereInput
    some?: CategoryDocumentWhereInput
    none?: CategoryDocumentWhereInput
  }

  export type SubcategoryDocumentListRelationFilter = {
    every?: SubcategoryDocumentWhereInput
    some?: SubcategoryDocumentWhereInput
    none?: SubcategoryDocumentWhereInput
  }

  export type CategoryDocumentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SubcategoryDocumentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type DocumentCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    description?: SortOrder
    hasExpiration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    description?: SortOrder
    hasExpiration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    description?: SortOrder
    hasExpiration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategoryListRelationFilter = {
    every?: SubcategoryWhereInput
    some?: SubcategoryWhereInput
    none?: SubcategoryWhereInput
  }

  export type SubcategoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    requiresQualification?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    requiresQualification?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    requiresQualification?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CategoryScalarRelationFilter = {
    is?: CategoryWhereInput
    isNot?: CategoryWhereInput
  }

  export type SubcategoryCountOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    requiresRegistration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    requiresRegistration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubcategoryMinOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    name?: SortOrder
    requiresRegistration?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DocumentScalarRelationFilter = {
    is?: DocumentWhereInput
    isNot?: DocumentWhereInput
  }

  export type CategoryDocumentCategoryIdDocumentIdDocumentTypeConditionKeyCompoundUniqueInput = {
    categoryId: string
    documentId: string
    documentType: string
    conditionKey: string
  }

  export type CategoryDocumentCountOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    documentId?: SortOrder
    documentType?: SortOrder
    conditionKey?: SortOrder
    requiredIfTrue?: SortOrder
    createdAt?: SortOrder
  }

  export type CategoryDocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    documentId?: SortOrder
    documentType?: SortOrder
    conditionKey?: SortOrder
    requiredIfTrue?: SortOrder
    createdAt?: SortOrder
  }

  export type CategoryDocumentMinOrderByAggregateInput = {
    id?: SortOrder
    categoryId?: SortOrder
    documentId?: SortOrder
    documentType?: SortOrder
    conditionKey?: SortOrder
    requiredIfTrue?: SortOrder
    createdAt?: SortOrder
  }

  export type SubcategoryScalarRelationFilter = {
    is?: SubcategoryWhereInput
    isNot?: SubcategoryWhereInput
  }

  export type SubcategoryDocumentSubcategoryIdDocumentIdCompoundUniqueInput = {
    subcategoryId: string
    documentId: string
  }

  export type SubcategoryDocumentCountOrderByAggregateInput = {
    id?: SortOrder
    subcategoryId?: SortOrder
    documentId?: SortOrder
    createdAt?: SortOrder
  }

  export type SubcategoryDocumentMaxOrderByAggregateInput = {
    id?: SortOrder
    subcategoryId?: SortOrder
    documentId?: SortOrder
    createdAt?: SortOrder
  }

  export type SubcategoryDocumentMinOrderByAggregateInput = {
    id?: SortOrder
    subcategoryId?: SortOrder
    documentId?: SortOrder
    createdAt?: SortOrder
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

  export type CategoryDocumentCreateNestedManyWithoutDocumentInput = {
    create?: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput> | CategoryDocumentCreateWithoutDocumentInput[] | CategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutDocumentInput | CategoryDocumentCreateOrConnectWithoutDocumentInput[]
    createMany?: CategoryDocumentCreateManyDocumentInputEnvelope
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
  }

  export type SubcategoryDocumentCreateNestedManyWithoutDocumentInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput> | SubcategoryDocumentCreateWithoutDocumentInput[] | SubcategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutDocumentInput | SubcategoryDocumentCreateOrConnectWithoutDocumentInput[]
    createMany?: SubcategoryDocumentCreateManyDocumentInputEnvelope
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
  }

  export type CategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput = {
    create?: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput> | CategoryDocumentCreateWithoutDocumentInput[] | CategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutDocumentInput | CategoryDocumentCreateOrConnectWithoutDocumentInput[]
    createMany?: CategoryDocumentCreateManyDocumentInputEnvelope
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
  }

  export type SubcategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput> | SubcategoryDocumentCreateWithoutDocumentInput[] | SubcategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutDocumentInput | SubcategoryDocumentCreateOrConnectWithoutDocumentInput[]
    createMany?: SubcategoryDocumentCreateManyDocumentInputEnvelope
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
  }

  export type CategoryDocumentUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput> | CategoryDocumentCreateWithoutDocumentInput[] | CategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutDocumentInput | CategoryDocumentCreateOrConnectWithoutDocumentInput[]
    upsert?: CategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput | CategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: CategoryDocumentCreateManyDocumentInputEnvelope
    set?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    disconnect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    delete?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    update?: CategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput | CategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: CategoryDocumentUpdateManyWithWhereWithoutDocumentInput | CategoryDocumentUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
  }

  export type SubcategoryDocumentUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput> | SubcategoryDocumentCreateWithoutDocumentInput[] | SubcategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutDocumentInput | SubcategoryDocumentCreateOrConnectWithoutDocumentInput[]
    upsert?: SubcategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput | SubcategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: SubcategoryDocumentCreateManyDocumentInputEnvelope
    set?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    disconnect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    delete?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    update?: SubcategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput | SubcategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: SubcategoryDocumentUpdateManyWithWhereWithoutDocumentInput | SubcategoryDocumentUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
  }

  export type CategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput> | CategoryDocumentCreateWithoutDocumentInput[] | CategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutDocumentInput | CategoryDocumentCreateOrConnectWithoutDocumentInput[]
    upsert?: CategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput | CategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: CategoryDocumentCreateManyDocumentInputEnvelope
    set?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    disconnect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    delete?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    update?: CategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput | CategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: CategoryDocumentUpdateManyWithWhereWithoutDocumentInput | CategoryDocumentUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
  }

  export type SubcategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput> | SubcategoryDocumentCreateWithoutDocumentInput[] | SubcategoryDocumentUncheckedCreateWithoutDocumentInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutDocumentInput | SubcategoryDocumentCreateOrConnectWithoutDocumentInput[]
    upsert?: SubcategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput | SubcategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput[]
    createMany?: SubcategoryDocumentCreateManyDocumentInputEnvelope
    set?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    disconnect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    delete?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    update?: SubcategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput | SubcategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput[]
    updateMany?: SubcategoryDocumentUpdateManyWithWhereWithoutDocumentInput | SubcategoryDocumentUpdateManyWithWhereWithoutDocumentInput[]
    deleteMany?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
  }

  export type SubcategoryCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type CategoryDocumentCreateNestedManyWithoutCategoryInput = {
    create?: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput> | CategoryDocumentCreateWithoutCategoryInput[] | CategoryDocumentUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutCategoryInput | CategoryDocumentCreateOrConnectWithoutCategoryInput[]
    createMany?: CategoryDocumentCreateManyCategoryInputEnvelope
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
  }

  export type SubcategoryUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
  }

  export type CategoryDocumentUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput> | CategoryDocumentCreateWithoutCategoryInput[] | CategoryDocumentUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutCategoryInput | CategoryDocumentCreateOrConnectWithoutCategoryInput[]
    createMany?: CategoryDocumentCreateManyCategoryInputEnvelope
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
  }

  export type SubcategoryUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutCategoryInput | SubcategoryUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutCategoryInput | SubcategoryUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutCategoryInput | SubcategoryUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type CategoryDocumentUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput> | CategoryDocumentCreateWithoutCategoryInput[] | CategoryDocumentUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutCategoryInput | CategoryDocumentCreateOrConnectWithoutCategoryInput[]
    upsert?: CategoryDocumentUpsertWithWhereUniqueWithoutCategoryInput | CategoryDocumentUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: CategoryDocumentCreateManyCategoryInputEnvelope
    set?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    disconnect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    delete?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    update?: CategoryDocumentUpdateWithWhereUniqueWithoutCategoryInput | CategoryDocumentUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: CategoryDocumentUpdateManyWithWhereWithoutCategoryInput | CategoryDocumentUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
  }

  export type SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput> | SubcategoryCreateWithoutCategoryInput[] | SubcategoryUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SubcategoryCreateOrConnectWithoutCategoryInput | SubcategoryCreateOrConnectWithoutCategoryInput[]
    upsert?: SubcategoryUpsertWithWhereUniqueWithoutCategoryInput | SubcategoryUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SubcategoryCreateManyCategoryInputEnvelope
    set?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    disconnect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    delete?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    connect?: SubcategoryWhereUniqueInput | SubcategoryWhereUniqueInput[]
    update?: SubcategoryUpdateWithWhereUniqueWithoutCategoryInput | SubcategoryUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SubcategoryUpdateManyWithWhereWithoutCategoryInput | SubcategoryUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
  }

  export type CategoryDocumentUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput> | CategoryDocumentCreateWithoutCategoryInput[] | CategoryDocumentUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: CategoryDocumentCreateOrConnectWithoutCategoryInput | CategoryDocumentCreateOrConnectWithoutCategoryInput[]
    upsert?: CategoryDocumentUpsertWithWhereUniqueWithoutCategoryInput | CategoryDocumentUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: CategoryDocumentCreateManyCategoryInputEnvelope
    set?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    disconnect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    delete?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    connect?: CategoryDocumentWhereUniqueInput | CategoryDocumentWhereUniqueInput[]
    update?: CategoryDocumentUpdateWithWhereUniqueWithoutCategoryInput | CategoryDocumentUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: CategoryDocumentUpdateManyWithWhereWithoutCategoryInput | CategoryDocumentUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
  }

  export type CategoryCreateNestedOneWithoutSubcategoriesInput = {
    create?: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutSubcategoriesInput
    connect?: CategoryWhereUniqueInput
  }

  export type SubcategoryDocumentCreateNestedManyWithoutSubcategoryInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput> | SubcategoryDocumentCreateWithoutSubcategoryInput[] | SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput | SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput[]
    createMany?: SubcategoryDocumentCreateManySubcategoryInputEnvelope
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
  }

  export type SubcategoryDocumentUncheckedCreateNestedManyWithoutSubcategoryInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput> | SubcategoryDocumentCreateWithoutSubcategoryInput[] | SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput | SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput[]
    createMany?: SubcategoryDocumentCreateManySubcategoryInputEnvelope
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
  }

  export type CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput = {
    create?: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutSubcategoriesInput
    upsert?: CategoryUpsertWithoutSubcategoriesInput
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutSubcategoriesInput, CategoryUpdateWithoutSubcategoriesInput>, CategoryUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type SubcategoryDocumentUpdateManyWithoutSubcategoryNestedInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput> | SubcategoryDocumentCreateWithoutSubcategoryInput[] | SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput | SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput[]
    upsert?: SubcategoryDocumentUpsertWithWhereUniqueWithoutSubcategoryInput | SubcategoryDocumentUpsertWithWhereUniqueWithoutSubcategoryInput[]
    createMany?: SubcategoryDocumentCreateManySubcategoryInputEnvelope
    set?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    disconnect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    delete?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    update?: SubcategoryDocumentUpdateWithWhereUniqueWithoutSubcategoryInput | SubcategoryDocumentUpdateWithWhereUniqueWithoutSubcategoryInput[]
    updateMany?: SubcategoryDocumentUpdateManyWithWhereWithoutSubcategoryInput | SubcategoryDocumentUpdateManyWithWhereWithoutSubcategoryInput[]
    deleteMany?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
  }

  export type SubcategoryDocumentUncheckedUpdateManyWithoutSubcategoryNestedInput = {
    create?: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput> | SubcategoryDocumentCreateWithoutSubcategoryInput[] | SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput[]
    connectOrCreate?: SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput | SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput[]
    upsert?: SubcategoryDocumentUpsertWithWhereUniqueWithoutSubcategoryInput | SubcategoryDocumentUpsertWithWhereUniqueWithoutSubcategoryInput[]
    createMany?: SubcategoryDocumentCreateManySubcategoryInputEnvelope
    set?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    disconnect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    delete?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    connect?: SubcategoryDocumentWhereUniqueInput | SubcategoryDocumentWhereUniqueInput[]
    update?: SubcategoryDocumentUpdateWithWhereUniqueWithoutSubcategoryInput | SubcategoryDocumentUpdateWithWhereUniqueWithoutSubcategoryInput[]
    updateMany?: SubcategoryDocumentUpdateManyWithWhereWithoutSubcategoryInput | SubcategoryDocumentUpdateManyWithWhereWithoutSubcategoryInput[]
    deleteMany?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
  }

  export type CategoryCreateNestedOneWithoutDocumentsInput = {
    create?: XOR<CategoryCreateWithoutDocumentsInput, CategoryUncheckedCreateWithoutDocumentsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutDocumentsInput
    connect?: CategoryWhereUniqueInput
  }

  export type DocumentCreateNestedOneWithoutCategoryDocumentsInput = {
    create?: XOR<DocumentCreateWithoutCategoryDocumentsInput, DocumentUncheckedCreateWithoutCategoryDocumentsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutCategoryDocumentsInput
    connect?: DocumentWhereUniqueInput
  }

  export type CategoryUpdateOneRequiredWithoutDocumentsNestedInput = {
    create?: XOR<CategoryCreateWithoutDocumentsInput, CategoryUncheckedCreateWithoutDocumentsInput>
    connectOrCreate?: CategoryCreateOrConnectWithoutDocumentsInput
    upsert?: CategoryUpsertWithoutDocumentsInput
    connect?: CategoryWhereUniqueInput
    update?: XOR<XOR<CategoryUpdateToOneWithWhereWithoutDocumentsInput, CategoryUpdateWithoutDocumentsInput>, CategoryUncheckedUpdateWithoutDocumentsInput>
  }

  export type DocumentUpdateOneRequiredWithoutCategoryDocumentsNestedInput = {
    create?: XOR<DocumentCreateWithoutCategoryDocumentsInput, DocumentUncheckedCreateWithoutCategoryDocumentsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutCategoryDocumentsInput
    upsert?: DocumentUpsertWithoutCategoryDocumentsInput
    connect?: DocumentWhereUniqueInput
    update?: XOR<XOR<DocumentUpdateToOneWithWhereWithoutCategoryDocumentsInput, DocumentUpdateWithoutCategoryDocumentsInput>, DocumentUncheckedUpdateWithoutCategoryDocumentsInput>
  }

  export type SubcategoryCreateNestedOneWithoutAdditionalDocumentsInput = {
    create?: XOR<SubcategoryCreateWithoutAdditionalDocumentsInput, SubcategoryUncheckedCreateWithoutAdditionalDocumentsInput>
    connectOrCreate?: SubcategoryCreateOrConnectWithoutAdditionalDocumentsInput
    connect?: SubcategoryWhereUniqueInput
  }

  export type DocumentCreateNestedOneWithoutSubcategoryDocumentsInput = {
    create?: XOR<DocumentCreateWithoutSubcategoryDocumentsInput, DocumentUncheckedCreateWithoutSubcategoryDocumentsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutSubcategoryDocumentsInput
    connect?: DocumentWhereUniqueInput
  }

  export type SubcategoryUpdateOneRequiredWithoutAdditionalDocumentsNestedInput = {
    create?: XOR<SubcategoryCreateWithoutAdditionalDocumentsInput, SubcategoryUncheckedCreateWithoutAdditionalDocumentsInput>
    connectOrCreate?: SubcategoryCreateOrConnectWithoutAdditionalDocumentsInput
    upsert?: SubcategoryUpsertWithoutAdditionalDocumentsInput
    connect?: SubcategoryWhereUniqueInput
    update?: XOR<XOR<SubcategoryUpdateToOneWithWhereWithoutAdditionalDocumentsInput, SubcategoryUpdateWithoutAdditionalDocumentsInput>, SubcategoryUncheckedUpdateWithoutAdditionalDocumentsInput>
  }

  export type DocumentUpdateOneRequiredWithoutSubcategoryDocumentsNestedInput = {
    create?: XOR<DocumentCreateWithoutSubcategoryDocumentsInput, DocumentUncheckedCreateWithoutSubcategoryDocumentsInput>
    connectOrCreate?: DocumentCreateOrConnectWithoutSubcategoryDocumentsInput
    upsert?: DocumentUpsertWithoutSubcategoryDocumentsInput
    connect?: DocumentWhereUniqueInput
    update?: XOR<XOR<DocumentUpdateToOneWithWhereWithoutSubcategoryDocumentsInput, DocumentUpdateWithoutSubcategoryDocumentsInput>, DocumentUncheckedUpdateWithoutSubcategoryDocumentsInput>
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

  export type CategoryDocumentCreateWithoutDocumentInput = {
    id?: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
    category: CategoryCreateNestedOneWithoutDocumentsInput
  }

  export type CategoryDocumentUncheckedCreateWithoutDocumentInput = {
    id?: string
    categoryId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type CategoryDocumentCreateOrConnectWithoutDocumentInput = {
    where: CategoryDocumentWhereUniqueInput
    create: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput>
  }

  export type CategoryDocumentCreateManyDocumentInputEnvelope = {
    data: CategoryDocumentCreateManyDocumentInput | CategoryDocumentCreateManyDocumentInput[]
    skipDuplicates?: boolean
  }

  export type SubcategoryDocumentCreateWithoutDocumentInput = {
    id?: string
    createdAt?: Date | string
    subcategory: SubcategoryCreateNestedOneWithoutAdditionalDocumentsInput
  }

  export type SubcategoryDocumentUncheckedCreateWithoutDocumentInput = {
    id?: string
    subcategoryId: string
    createdAt?: Date | string
  }

  export type SubcategoryDocumentCreateOrConnectWithoutDocumentInput = {
    where: SubcategoryDocumentWhereUniqueInput
    create: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput>
  }

  export type SubcategoryDocumentCreateManyDocumentInputEnvelope = {
    data: SubcategoryDocumentCreateManyDocumentInput | SubcategoryDocumentCreateManyDocumentInput[]
    skipDuplicates?: boolean
  }

  export type CategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput = {
    where: CategoryDocumentWhereUniqueInput
    update: XOR<CategoryDocumentUpdateWithoutDocumentInput, CategoryDocumentUncheckedUpdateWithoutDocumentInput>
    create: XOR<CategoryDocumentCreateWithoutDocumentInput, CategoryDocumentUncheckedCreateWithoutDocumentInput>
  }

  export type CategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput = {
    where: CategoryDocumentWhereUniqueInput
    data: XOR<CategoryDocumentUpdateWithoutDocumentInput, CategoryDocumentUncheckedUpdateWithoutDocumentInput>
  }

  export type CategoryDocumentUpdateManyWithWhereWithoutDocumentInput = {
    where: CategoryDocumentScalarWhereInput
    data: XOR<CategoryDocumentUpdateManyMutationInput, CategoryDocumentUncheckedUpdateManyWithoutDocumentInput>
  }

  export type CategoryDocumentScalarWhereInput = {
    AND?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
    OR?: CategoryDocumentScalarWhereInput[]
    NOT?: CategoryDocumentScalarWhereInput | CategoryDocumentScalarWhereInput[]
    id?: StringFilter<"CategoryDocument"> | string
    categoryId?: StringFilter<"CategoryDocument"> | string
    documentId?: StringFilter<"CategoryDocument"> | string
    documentType?: StringFilter<"CategoryDocument"> | string
    conditionKey?: StringNullableFilter<"CategoryDocument"> | string | null
    requiredIfTrue?: BoolNullableFilter<"CategoryDocument"> | boolean | null
    createdAt?: DateTimeFilter<"CategoryDocument"> | Date | string
  }

  export type SubcategoryDocumentUpsertWithWhereUniqueWithoutDocumentInput = {
    where: SubcategoryDocumentWhereUniqueInput
    update: XOR<SubcategoryDocumentUpdateWithoutDocumentInput, SubcategoryDocumentUncheckedUpdateWithoutDocumentInput>
    create: XOR<SubcategoryDocumentCreateWithoutDocumentInput, SubcategoryDocumentUncheckedCreateWithoutDocumentInput>
  }

  export type SubcategoryDocumentUpdateWithWhereUniqueWithoutDocumentInput = {
    where: SubcategoryDocumentWhereUniqueInput
    data: XOR<SubcategoryDocumentUpdateWithoutDocumentInput, SubcategoryDocumentUncheckedUpdateWithoutDocumentInput>
  }

  export type SubcategoryDocumentUpdateManyWithWhereWithoutDocumentInput = {
    where: SubcategoryDocumentScalarWhereInput
    data: XOR<SubcategoryDocumentUpdateManyMutationInput, SubcategoryDocumentUncheckedUpdateManyWithoutDocumentInput>
  }

  export type SubcategoryDocumentScalarWhereInput = {
    AND?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
    OR?: SubcategoryDocumentScalarWhereInput[]
    NOT?: SubcategoryDocumentScalarWhereInput | SubcategoryDocumentScalarWhereInput[]
    id?: StringFilter<"SubcategoryDocument"> | string
    subcategoryId?: StringFilter<"SubcategoryDocument"> | string
    documentId?: StringFilter<"SubcategoryDocument"> | string
    createdAt?: DateTimeFilter<"SubcategoryDocument"> | Date | string
  }

  export type SubcategoryCreateWithoutCategoryInput = {
    id: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    additionalDocuments?: SubcategoryDocumentCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryUncheckedCreateWithoutCategoryInput = {
    id: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    additionalDocuments?: SubcategoryDocumentUncheckedCreateNestedManyWithoutSubcategoryInput
  }

  export type SubcategoryCreateOrConnectWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    create: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput>
  }

  export type SubcategoryCreateManyCategoryInputEnvelope = {
    data: SubcategoryCreateManyCategoryInput | SubcategoryCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type CategoryDocumentCreateWithoutCategoryInput = {
    id?: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
    document: DocumentCreateNestedOneWithoutCategoryDocumentsInput
  }

  export type CategoryDocumentUncheckedCreateWithoutCategoryInput = {
    id?: string
    documentId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type CategoryDocumentCreateOrConnectWithoutCategoryInput = {
    where: CategoryDocumentWhereUniqueInput
    create: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput>
  }

  export type CategoryDocumentCreateManyCategoryInputEnvelope = {
    data: CategoryDocumentCreateManyCategoryInput | CategoryDocumentCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type SubcategoryUpsertWithWhereUniqueWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    update: XOR<SubcategoryUpdateWithoutCategoryInput, SubcategoryUncheckedUpdateWithoutCategoryInput>
    create: XOR<SubcategoryCreateWithoutCategoryInput, SubcategoryUncheckedCreateWithoutCategoryInput>
  }

  export type SubcategoryUpdateWithWhereUniqueWithoutCategoryInput = {
    where: SubcategoryWhereUniqueInput
    data: XOR<SubcategoryUpdateWithoutCategoryInput, SubcategoryUncheckedUpdateWithoutCategoryInput>
  }

  export type SubcategoryUpdateManyWithWhereWithoutCategoryInput = {
    where: SubcategoryScalarWhereInput
    data: XOR<SubcategoryUpdateManyMutationInput, SubcategoryUncheckedUpdateManyWithoutCategoryInput>
  }

  export type SubcategoryScalarWhereInput = {
    AND?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
    OR?: SubcategoryScalarWhereInput[]
    NOT?: SubcategoryScalarWhereInput | SubcategoryScalarWhereInput[]
    id?: StringFilter<"Subcategory"> | string
    categoryId?: StringFilter<"Subcategory"> | string
    name?: StringFilter<"Subcategory"> | string
    requiresRegistration?: StringNullableFilter<"Subcategory"> | string | null
    createdAt?: DateTimeFilter<"Subcategory"> | Date | string
    updatedAt?: DateTimeFilter<"Subcategory"> | Date | string
  }

  export type CategoryDocumentUpsertWithWhereUniqueWithoutCategoryInput = {
    where: CategoryDocumentWhereUniqueInput
    update: XOR<CategoryDocumentUpdateWithoutCategoryInput, CategoryDocumentUncheckedUpdateWithoutCategoryInput>
    create: XOR<CategoryDocumentCreateWithoutCategoryInput, CategoryDocumentUncheckedCreateWithoutCategoryInput>
  }

  export type CategoryDocumentUpdateWithWhereUniqueWithoutCategoryInput = {
    where: CategoryDocumentWhereUniqueInput
    data: XOR<CategoryDocumentUpdateWithoutCategoryInput, CategoryDocumentUncheckedUpdateWithoutCategoryInput>
  }

  export type CategoryDocumentUpdateManyWithWhereWithoutCategoryInput = {
    where: CategoryDocumentScalarWhereInput
    data: XOR<CategoryDocumentUpdateManyMutationInput, CategoryDocumentUncheckedUpdateManyWithoutCategoryInput>
  }

  export type CategoryCreateWithoutSubcategoriesInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    documents?: CategoryDocumentCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateWithoutSubcategoriesInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    documents?: CategoryDocumentUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryCreateOrConnectWithoutSubcategoriesInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
  }

  export type SubcategoryDocumentCreateWithoutSubcategoryInput = {
    id?: string
    createdAt?: Date | string
    document: DocumentCreateNestedOneWithoutSubcategoryDocumentsInput
  }

  export type SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput = {
    id?: string
    documentId: string
    createdAt?: Date | string
  }

  export type SubcategoryDocumentCreateOrConnectWithoutSubcategoryInput = {
    where: SubcategoryDocumentWhereUniqueInput
    create: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput>
  }

  export type SubcategoryDocumentCreateManySubcategoryInputEnvelope = {
    data: SubcategoryDocumentCreateManySubcategoryInput | SubcategoryDocumentCreateManySubcategoryInput[]
    skipDuplicates?: boolean
  }

  export type CategoryUpsertWithoutSubcategoriesInput = {
    update: XOR<CategoryUpdateWithoutSubcategoriesInput, CategoryUncheckedUpdateWithoutSubcategoriesInput>
    create: XOR<CategoryCreateWithoutSubcategoriesInput, CategoryUncheckedCreateWithoutSubcategoriesInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutSubcategoriesInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutSubcategoriesInput, CategoryUncheckedUpdateWithoutSubcategoriesInput>
  }

  export type CategoryUpdateWithoutSubcategoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    documents?: CategoryDocumentUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateWithoutSubcategoriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    documents?: CategoryDocumentUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type SubcategoryDocumentUpsertWithWhereUniqueWithoutSubcategoryInput = {
    where: SubcategoryDocumentWhereUniqueInput
    update: XOR<SubcategoryDocumentUpdateWithoutSubcategoryInput, SubcategoryDocumentUncheckedUpdateWithoutSubcategoryInput>
    create: XOR<SubcategoryDocumentCreateWithoutSubcategoryInput, SubcategoryDocumentUncheckedCreateWithoutSubcategoryInput>
  }

  export type SubcategoryDocumentUpdateWithWhereUniqueWithoutSubcategoryInput = {
    where: SubcategoryDocumentWhereUniqueInput
    data: XOR<SubcategoryDocumentUpdateWithoutSubcategoryInput, SubcategoryDocumentUncheckedUpdateWithoutSubcategoryInput>
  }

  export type SubcategoryDocumentUpdateManyWithWhereWithoutSubcategoryInput = {
    where: SubcategoryDocumentScalarWhereInput
    data: XOR<SubcategoryDocumentUpdateManyMutationInput, SubcategoryDocumentUncheckedUpdateManyWithoutSubcategoryInput>
  }

  export type CategoryCreateWithoutDocumentsInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryCreateNestedManyWithoutCategoryInput
  }

  export type CategoryUncheckedCreateWithoutDocumentsInput = {
    id: string
    name: string
    requiresQualification?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategories?: SubcategoryUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type CategoryCreateOrConnectWithoutDocumentsInput = {
    where: CategoryWhereUniqueInput
    create: XOR<CategoryCreateWithoutDocumentsInput, CategoryUncheckedCreateWithoutDocumentsInput>
  }

  export type DocumentCreateWithoutCategoryDocumentsInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategoryDocuments?: SubcategoryDocumentCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateWithoutCategoryDocumentsInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    subcategoryDocuments?: SubcategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentCreateOrConnectWithoutCategoryDocumentsInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutCategoryDocumentsInput, DocumentUncheckedCreateWithoutCategoryDocumentsInput>
  }

  export type CategoryUpsertWithoutDocumentsInput = {
    update: XOR<CategoryUpdateWithoutDocumentsInput, CategoryUncheckedUpdateWithoutDocumentsInput>
    create: XOR<CategoryCreateWithoutDocumentsInput, CategoryUncheckedCreateWithoutDocumentsInput>
    where?: CategoryWhereInput
  }

  export type CategoryUpdateToOneWithWhereWithoutDocumentsInput = {
    where?: CategoryWhereInput
    data: XOR<CategoryUpdateWithoutDocumentsInput, CategoryUncheckedUpdateWithoutDocumentsInput>
  }

  export type CategoryUpdateWithoutDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUpdateManyWithoutCategoryNestedInput
  }

  export type CategoryUncheckedUpdateWithoutDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresQualification?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategories?: SubcategoryUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type DocumentUpsertWithoutCategoryDocumentsInput = {
    update: XOR<DocumentUpdateWithoutCategoryDocumentsInput, DocumentUncheckedUpdateWithoutCategoryDocumentsInput>
    create: XOR<DocumentCreateWithoutCategoryDocumentsInput, DocumentUncheckedCreateWithoutCategoryDocumentsInput>
    where?: DocumentWhereInput
  }

  export type DocumentUpdateToOneWithWhereWithoutCategoryDocumentsInput = {
    where?: DocumentWhereInput
    data: XOR<DocumentUpdateWithoutCategoryDocumentsInput, DocumentUncheckedUpdateWithoutCategoryDocumentsInput>
  }

  export type DocumentUpdateWithoutCategoryDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategoryDocuments?: SubcategoryDocumentUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateWithoutCategoryDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategoryDocuments?: SubcategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type SubcategoryCreateWithoutAdditionalDocumentsInput = {
    id: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    category: CategoryCreateNestedOneWithoutSubcategoriesInput
  }

  export type SubcategoryUncheckedCreateWithoutAdditionalDocumentsInput = {
    id: string
    categoryId: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubcategoryCreateOrConnectWithoutAdditionalDocumentsInput = {
    where: SubcategoryWhereUniqueInput
    create: XOR<SubcategoryCreateWithoutAdditionalDocumentsInput, SubcategoryUncheckedCreateWithoutAdditionalDocumentsInput>
  }

  export type DocumentCreateWithoutSubcategoryDocumentsInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryDocuments?: CategoryDocumentCreateNestedManyWithoutDocumentInput
  }

  export type DocumentUncheckedCreateWithoutSubcategoryDocumentsInput = {
    id: string
    name: string
    category: string
    description: string
    hasExpiration?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    categoryDocuments?: CategoryDocumentUncheckedCreateNestedManyWithoutDocumentInput
  }

  export type DocumentCreateOrConnectWithoutSubcategoryDocumentsInput = {
    where: DocumentWhereUniqueInput
    create: XOR<DocumentCreateWithoutSubcategoryDocumentsInput, DocumentUncheckedCreateWithoutSubcategoryDocumentsInput>
  }

  export type SubcategoryUpsertWithoutAdditionalDocumentsInput = {
    update: XOR<SubcategoryUpdateWithoutAdditionalDocumentsInput, SubcategoryUncheckedUpdateWithoutAdditionalDocumentsInput>
    create: XOR<SubcategoryCreateWithoutAdditionalDocumentsInput, SubcategoryUncheckedCreateWithoutAdditionalDocumentsInput>
    where?: SubcategoryWhereInput
  }

  export type SubcategoryUpdateToOneWithWhereWithoutAdditionalDocumentsInput = {
    where?: SubcategoryWhereInput
    data: XOR<SubcategoryUpdateWithoutAdditionalDocumentsInput, SubcategoryUncheckedUpdateWithoutAdditionalDocumentsInput>
  }

  export type SubcategoryUpdateWithoutAdditionalDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutSubcategoriesNestedInput
  }

  export type SubcategoryUncheckedUpdateWithoutAdditionalDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DocumentUpsertWithoutSubcategoryDocumentsInput = {
    update: XOR<DocumentUpdateWithoutSubcategoryDocumentsInput, DocumentUncheckedUpdateWithoutSubcategoryDocumentsInput>
    create: XOR<DocumentCreateWithoutSubcategoryDocumentsInput, DocumentUncheckedCreateWithoutSubcategoryDocumentsInput>
    where?: DocumentWhereInput
  }

  export type DocumentUpdateToOneWithWhereWithoutSubcategoryDocumentsInput = {
    where?: DocumentWhereInput
    data: XOR<DocumentUpdateWithoutSubcategoryDocumentsInput, DocumentUncheckedUpdateWithoutSubcategoryDocumentsInput>
  }

  export type DocumentUpdateWithoutSubcategoryDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryDocuments?: CategoryDocumentUpdateManyWithoutDocumentNestedInput
  }

  export type DocumentUncheckedUpdateWithoutSubcategoryDocumentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    hasExpiration?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categoryDocuments?: CategoryDocumentUncheckedUpdateManyWithoutDocumentNestedInput
  }

  export type CategoryDocumentCreateManyDocumentInput = {
    id?: string
    categoryId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type SubcategoryDocumentCreateManyDocumentInput = {
    id?: string
    subcategoryId: string
    createdAt?: Date | string
  }

  export type CategoryDocumentUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: CategoryUpdateOneRequiredWithoutDocumentsNestedInput
  }

  export type CategoryDocumentUncheckedUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentUncheckedUpdateManyWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    categoryId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    subcategory?: SubcategoryUpdateOneRequiredWithoutAdditionalDocumentsNestedInput
  }

  export type SubcategoryDocumentUncheckedUpdateWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    subcategoryId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentUncheckedUpdateManyWithoutDocumentInput = {
    id?: StringFieldUpdateOperationsInput | string
    subcategoryId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryCreateManyCategoryInput = {
    id: string
    name: string
    requiresRegistration?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CategoryDocumentCreateManyCategoryInput = {
    id?: string
    documentId: string
    documentType: string
    conditionKey?: string | null
    requiredIfTrue?: boolean | null
    createdAt?: Date | string
  }

  export type SubcategoryUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    additionalDocuments?: SubcategoryDocumentUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    additionalDocuments?: SubcategoryDocumentUncheckedUpdateManyWithoutSubcategoryNestedInput
  }

  export type SubcategoryUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    requiresRegistration?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    document?: DocumentUpdateOneRequiredWithoutCategoryDocumentsNestedInput
  }

  export type CategoryDocumentUncheckedUpdateWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CategoryDocumentUncheckedUpdateManyWithoutCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    documentType?: StringFieldUpdateOperationsInput | string
    conditionKey?: NullableStringFieldUpdateOperationsInput | string | null
    requiredIfTrue?: NullableBoolFieldUpdateOperationsInput | boolean | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentCreateManySubcategoryInput = {
    id?: string
    documentId: string
    createdAt?: Date | string
  }

  export type SubcategoryDocumentUpdateWithoutSubcategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    document?: DocumentUpdateOneRequiredWithoutSubcategoryDocumentsNestedInput
  }

  export type SubcategoryDocumentUncheckedUpdateWithoutSubcategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubcategoryDocumentUncheckedUpdateManyWithoutSubcategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    documentId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
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