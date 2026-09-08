/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_API_URL: string;
  readonly VITE_EVOLUTION_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}