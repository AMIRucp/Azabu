import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: '#0B0F14' }}>
      <div className="w-full max-w-md mx-4 rounded-xl p-8" style={{ background: '#111520', border: '1px solid #1B2030' }}>
        <div className="flex mb-4 gap-2 items-center">
          <AlertCircle className="h-6 w-6" style={{ color: '#EF4444' }} />
          <h1 className="text-xl font-semibold" style={{ color: '#E6EDF3' }}>Page not found</h1>
        </div>
        <p className="text-sm" style={{ color: '#6B7280' }}>
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}
