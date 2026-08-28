import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        {/* Illustration */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-primary-subtle rounded-3xl flex items-center justify-center">
            <span className="text-6xl font-bold text-primary/20">404</span>
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 bg-warning rounded-xl flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-text-primary mb-3">Page Not Found</h1>
        <p className="text-text-muted text-lg mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 bg-surface border border-border hover:bg-surface-muted text-text-primary font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
