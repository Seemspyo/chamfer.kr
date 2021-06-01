import { InjectionToken } from '@angular/core';
import { ParameterizedContext } from 'koa';


export const KOA_CONTEXT = new InjectionToken<ParameterizedContext>('auth-strategy.koa-context');
