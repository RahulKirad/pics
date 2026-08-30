import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MarketingPageProps {
  title: string;
  description: string;
}

export function MarketingPage({ title, description }: MarketingPageProps) {
  return (
    <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">{title}</h1>
        <p className="text-muted-foreground mb-8">{description}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Full content coming in a future phase.
        </p>
        <Link to="/register">
          <Button>Get Started</Button>
        </Link>
      </div>
    </div>
  );
}
