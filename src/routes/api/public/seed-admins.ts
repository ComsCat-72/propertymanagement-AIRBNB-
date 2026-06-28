import { createFileRoute } from "@tanstack/react-router";

const ADMINS = [
  { email: "admin1@loyalityreal250.com", password: "Admin12345!", full_name: "Admin One" },
  { email: "admin2@loyalityreal250.com", password: "Admin12345!", full_name: "Admin Two" },
];

export const Route = createFileRoute("/api/public/seed-admins")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const results: Array<{ email: string; status: string }> = [];
        for (const a of ADMINS) {
          // Look up by email via list
          const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          let user = list?.users.find((u) => u.email?.toLowerCase() === a.email.toLowerCase()) ?? null;
          if (!user) {
            const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
              email: a.email,
              password: a.password,
              email_confirm: true,
              user_metadata: { full_name: a.full_name },
            });
            if (error || !created.user) {
              results.push({ email: a.email, status: `error: ${error?.message ?? "unknown"}` });
              continue;
            }
            user = created.user;
          }
          // Ensure active profile + admin role
          await supabaseAdmin.from("profiles").update({ status: "active", full_name: a.full_name }).eq("id", user.id);
          await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
          results.push({ email: a.email, status: "ok" });
        }

        return new Response(
          JSON.stringify({
            ok: true,
            credentials: ADMINS.map((a) => ({ email: a.email, password: a.password })),
            results,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});