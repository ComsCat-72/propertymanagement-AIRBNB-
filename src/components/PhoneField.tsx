import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/phone";

export function PhoneField({
  id,
  dial,
  local,
  onDialChange,
  onLocalChange,
}: {
  id?: string;
  dial: string;
  local: string;
  onDialChange: (dial: string) => void;
  onLocalChange: (local: string) => void;
}) {
  return (
    <div className="mt-1 flex gap-2">
      <select
        aria-label="Country code"
        value={dial}
        onChange={(e) => onDialChange(e.target.value)}
        className="h-9 w-[46%] max-w-[180px] rounded-xl border border-input bg-background px-2 text-sm"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.name} +{c.dial}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        placeholder="780 979 872"
        value={local}
        onChange={(e) => onLocalChange(e.target.value)}
        className="flex-1 rounded-xl"
      />
    </div>
  );
}
