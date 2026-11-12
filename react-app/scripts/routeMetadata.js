import process from 'node:process';
import { loadEnv } from 'vite';
import { buildPageMetadata } from '../src/config/pageMetadata.js';
import { resolvePublicOrigin } from '../src/config/publicOrigin.js';
import { readRuntimeConfig } from '../src/utils/runtimeConfig.js';

const environment = { ...loadEnv('production', process.cwd(), ''), ...process.env };

export const siteUrl = resolvePublicOrigin(environment);
export const socialImage = `${siteUrl}/images/social-share.jpg`;
// The same flag derivation as the browser bundle, so static ordering copy matches the hydrated page.
export const routeMetadata = buildPageMetadata(readRuntimeConfig(environment));
