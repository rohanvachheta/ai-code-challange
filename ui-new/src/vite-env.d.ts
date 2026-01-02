/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USER_SERVICE_URL: string
  readonly VITE_SEARCH_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
