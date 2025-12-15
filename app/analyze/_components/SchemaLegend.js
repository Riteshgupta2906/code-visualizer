
import { Panel } from "@xyflow/react";

export default function SchemaLegend() {
  const items = [
    { 
      label: "Primary Key", 
      color: "bg-amber-500/20 border-l-2 border-l-amber-400/60", 
      text: "text-amber-200" 
    },
    { 
      label: "Unique", 
      color: "bg-violet-500/20 border-l-2 border-l-violet-400/60", 
      text: "text-violet-200" 
    },
    { 
      label: "Relation", 
      color: "bg-blue-500/20 border-l-2 border-l-blue-400/60", 
      text: "text-blue-200" 
    },
    { 
      label: "Enum", 
      color: "bg-fuchsia-500/20 border-l-2 border-l-fuchsia-400/60", 
      text: "text-fuchsia-200" 
    },
  ];

  return (
    <Panel position="bottom-center" className="!mb-8">
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-xl bg-black/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]">
        <span className="text-xs font-semibold text-white/40 mr-1 uppercase tracking-wider">Legend</span>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${item.color}`} />
            <span className={`text-xs font-medium ${item.text}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
