import { ValueOf } from '@chamfer/util/dist/type-def';


export const productTypes = {
  forward: 'forward'
} as const;

export type ProductType = ValueOf<typeof productTypes>;
