import { ValueOf } from '@chamfer/util/dist/type-def';


export const bannerLinkTargets = {
  self: 0,
  blank: 1
} as const;

export type BannerLinkTarget = ValueOf<typeof bannerLinkTargets>;
