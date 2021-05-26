export type Integral<T> = { [ P in keyof T ]-?: NonNullable<T[P]>; }
