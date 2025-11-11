import { Loader2 } from "lucide-react";

export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}
