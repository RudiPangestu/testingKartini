/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URL absolut API untuk build produksi (mis.
  // https://sipres-api-poy9.onrender.com/api/v1). Bila kosong, web memakai
  // path relatif '/api/v1' yang diproxy oleh dev server Vite.
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
