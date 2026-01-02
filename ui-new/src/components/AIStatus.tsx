import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Search, Target, Volume2, MapPin, Phone } from 'lucide-react';
import { detectQueryIntent } from '@/lib/aiSearchEngine';

interface AIStatusProps {
  query: string;
  suggestionsCount: number;
}

export function AIStatus({ query, suggestionsCount }: AIStatusProps) {
  if (!query.trim()) return null;

  const intent = detectQueryIntent(query);
  
  const getAIFeatures = () => {
    const features = [];
    const lowerQuery = query.toLowerCase();
    
    // Phone number detection
    const phonePattern = /^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^[0-9]{3,10}$/;
    if (phonePattern.test(query.replace(/[^0-9\(\)\-\.\s]/g, ''))) {
      features.push({ name: 'Phone Search', icon: <Phone className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-800' });
    }
    
    // Location detection
    const locationKeywords = ['near', 'in', 'around', 'close', 'nearby', 'location', 'area', 'city', 'state', 'dealer', 'dealership', 'auto center', 'motors'];
    if (locationKeywords.some(keyword => lowerQuery.includes(keyword))) {
      features.push({ name: 'Location Search', icon: <MapPin className="w-3 h-3" />, color: 'bg-cyan-100 text-cyan-800' });
    }
    
    // Standard AI features
    if (query.length >= 2) {
      features.push({ name: 'Fuzzy Search', icon: <Search className="w-3 h-3" />, color: 'bg-blue-100 text-blue-800' });
    }
    
    if (query.length >= 3) {
      features.push({ name: 'Phonetic Match', icon: <Volume2 className="w-3 h-3" />, color: 'bg-green-100 text-green-800' });
    }
    
    if (/\s/.test(query) && query.length >= 3) {
      features.push({ name: 'NLP Processing', icon: <Brain className="w-3 h-3" />, color: 'bg-purple-100 text-purple-800' });
    }
    
    if (intent.confidence > 0.8) {
      features.push({ name: 'Intent Detection', icon: <Target className="w-3 h-3" />, color: 'bg-orange-100 text-orange-800' });
    }
    
    features.push({ name: 'Auto-correction', icon: <Zap className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-800' });
    
    return features;
  };

  const features = getAIFeatures();
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg mb-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Brain className="w-3 h-3" />
        <span>AI Active:</span>
      </div>
      
      {features.map((feature, index) => (
        <Badge key={index} variant="outline" className={`text-xs ${feature.color} border-current`}>
          {feature.icon}
          <span className="ml-1">{feature.name}</span>
        </Badge>
      ))}
      
      {intent.intent !== 'search_vehicle' && (
        <Badge variant="outline" className="text-xs bg-indigo-100 text-indigo-800 border-current">
          <Target className="w-3 h-3 mr-1" />
          Intent: {intent.intent.replace('search_by_', '').replace('_', ' ')}
        </Badge>
      )}
      
      <div className="text-xs text-muted-foreground ml-auto">
        {suggestionsCount} AI suggestions
      </div>
    </div>
  );
}