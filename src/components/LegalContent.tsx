import { Fragment } from "react";
import type { LegalNode } from "@/lib/legalPagesI18n";

// Renders a sequence of LegalNode entries with **bold** and __italic__ inline markers.
// Kept intentionally simple: legal copy authored in legalPagesI18n.ts is the
// only caller, so we don't need a full markdown parser.

const renderInline = (text: string): React.ReactNode => {
  // Split on **bold** and __italic__ markers, preserving order.
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <em key={i}>{part.slice(2, -2)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
};

export const LegalContent = ({ nodes }: { nodes: LegalNode[] }) => {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case "h2":
            return <h2 key={i}>{renderInline(node.text)}</h2>;
          case "h3":
            return <h3 key={i}>{renderInline(node.text)}</h3>;
          case "p":
            return <p key={i}>{renderInline(node.text)}</p>;
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5">
                {node.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-5">
                {node.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ol>
            );
        }
      })}
    </>
  );
};
