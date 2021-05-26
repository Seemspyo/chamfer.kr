import { ValueOf } from '@chamfer/util/dist/type-def';


export const userProviders = {
  email: 0
} as const;

export type UserProvider = ValueOf<typeof userProviders>;

export const userRoles = {
  common: 'common',
  deus: 'deus',
  admin: 'admin'
} as const;

export type UserRole = ValueOf<typeof userRoles>;

export const allUsers = Object.values(userRoles);

export const adminUsers = [
  userRoles.deus,
  userRoles.admin
]
