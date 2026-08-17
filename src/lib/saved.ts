import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** IDs of the properties the signed-in visitor has saved. */
export function useSavedIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_properties").select("property_id").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.property_id as string);
    },
  });
}

export function useToggleSaved(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ propertyId, saved }: { propertyId: string; saved: boolean }) => {
      if (!userId) throw new Error("Sign in to save properties");
      if (saved) {
        const { error } = await supabase.from("saved_properties").delete().eq("user_id", userId).eq("property_id", propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_properties").insert({ user_id: userId, property_id: propertyId } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["saved-ids", userId] });
      void qc.invalidateQueries({ queryKey: ["saved-properties", userId] });
    },
  });
}
