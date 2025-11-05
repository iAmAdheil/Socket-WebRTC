import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="max-w-md w-full shadow-lg border-border/50 bg-card/95 backdrop-blur-xl">
        <CardContent className="p-12 text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-gradient-primary/10 rounded-3xl flex items-center justify-center shadow-medium mb-4">
            <AlertCircle className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-2xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground text-lg">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <Button asChild className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-lg hover:scale-[1.02] h-12 font-semibold">
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
