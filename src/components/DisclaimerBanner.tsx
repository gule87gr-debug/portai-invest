import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export const DisclaimerBanner = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <p>
        <span className="font-semibold text-warning">Not financial advice</span>
        <span className="text-muted-foreground">
          {" "}— AI analysis is for informational purposes only. Always consult qualified financial professionals before making investment decisions.
        </span>
      </p>
      <button onClick={() => setVisible(false)} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
