declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    HUB_ARCHIVE_ON_SCHEDULE?: string;
  }
}
