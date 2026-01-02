import { FuzzyMatchDemo } from '@/components/FuzzyMatchDemo';

export default function Demo() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Smart Search Demo</h1>
          <p className="text-muted-foreground">
            Experience AI-powered automotive search with intelligent typo correction and fuzzy matching
          </p>
        </div>
        
        <FuzzyMatchDemo />
      </div>
    </div>
  );
}