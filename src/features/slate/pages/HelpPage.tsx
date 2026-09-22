import { HelpCircle } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import PageHead from "../components/PageHead";
import { HELP_TOPICS } from "../utils/notifications";

export default function HelpPage() {
  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div style={{ flexShrink: 0 }}>
        <PageHead title="Help & FAQs" sub="Answers to common questions about how SLATE works." />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div className="flex flex-col gap-3">
          {HELP_TOPICS.map((h, i) => (
            <Card key={i} style={{ padding: "16px 18px" }}>
              <div className="flex items-start gap-2.5" style={{ fontSize: 13.5, fontWeight: 700, color: "#161b22" }}>
                <HelpCircle size={16} style={{ marginTop: 1, flexShrink: 0, color: "#8f6a26" }} />
                <span>{h.q}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#717881", marginTop: 6, lineHeight: 1.6, paddingLeft: 26 }}>{h.a}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
