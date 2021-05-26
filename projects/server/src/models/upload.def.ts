import { ValueOf } from '@chamfer/util/dist/type-def';


export const uploadProviders = {
  s3: 's3'
} as const;
export type UploadProvider = ValueOf<typeof uploadProviders>;
