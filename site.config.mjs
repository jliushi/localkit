export const SITE_ORIGIN = process.env.SITE_ORIGIN ?? 'https://jliushi.github.io';
export const BASE_PATH = process.env.BASE_PATH ?? '/localkit';
export const REPO_URL = 'https://github.com/jliushi/localkit';
export const LANGS = ['en', 'zh'];

export const url = (path = '/') => `${BASE_PATH}${path}`;
export const absUrl = (path = '/') => `${SITE_ORIGIN}${BASE_PATH}${path}`;
