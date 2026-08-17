import { supabase } from "@/integrations/supabase/client";

export type InquiryChannel = "whatsapp" | "call" | "profile";

/**
 * Record that a signed-in visitor contacted an agent.
 * Silent no-op for signed-out visitors and for agents contacting themselves.
 */
export async function logInquiry(agentId: string, propertyId: string | null, channel: InquiryChannel) {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid || uid === agentId) return;
  await supabase
    .from("agent_inquiries")
    .insert({ client_id: uid, agent_id: agentId, property_id: propertyId, channel } as never);
}
