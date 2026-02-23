declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_PINATA_GATEWAY: string;
  readonly VITE_XMTP_ENV: "dev" | "production" | "local" | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
