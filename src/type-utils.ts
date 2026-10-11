export type LiteralUnion<LiteralType, BaseType extends string> =
  | LiteralType
  | (BaseType & Record<never, never>);

export type OmitIndexSignature<T> = {
  [K in keyof T as Record<never, never> extends Record<K, unknown>
    ? never
    : K]: T[K];
};

export type UnionToIntersection<T> = (
  T extends unknown
    ? (value: T) => void
    : never
) extends (value: infer Intersection) => void
  ? Intersection & T
  : never;
