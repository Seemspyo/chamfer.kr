import { ValueOf } from '@chamfer/util/dist/type-def';


export const productTypes = {
  forward: 0
} as const;

export type ProductType = ValueOf<typeof productTypes>;
