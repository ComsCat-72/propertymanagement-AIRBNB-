/**
 * Public Lovable Cloud connection values.
 *
 * These values are intentionally browser-visible. Deployment environment
 * variables override them in vite.config.ts, while privileged credentials
 * (service-role and Cloudinary secrets) remain environment-only.
 */
export const publicBackendConfig = {
  url: "https://xwgwksurcsljwwbqhjwe.supabase.co",
  publishableKey: "sb_publishable_5j5mBGvAkIezUl3UNEjdEQ_TtDgkrIp",
  projectId: "xwgwksurcsljwwbqhjwe",
} as const;