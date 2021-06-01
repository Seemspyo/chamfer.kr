import { ValueOf } from '@chamfer/util/dist/type-def';


export const bannerLinkTargets = {
  self: 'self',
  blank: 'blank'
} as const;

export type BannerLinkTarget = ValueOf<typeof bannerLinkTargets>;
