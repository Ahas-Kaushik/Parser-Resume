/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ENABLE_CHAT: string
  readonly VITE_ENABLE_EMAIL_NOTIFICATIONS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}