import { useState } from 'react';
import { ChevronDown, ChevronUp, Car, ShoppingCart, Truck, MapPin, Calendar, Phone, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OfferResult, PurchaseResult, TransportResult, EntityType } from '@/types/search';

interface ResultGroupProps<T> {
  title: string;
  entityType: EntityType;
  results: T[];
  renderItem: (item: T) => React.ReactNode;
}

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  offer: <Car className="w-5 h-5" />,
  purchase: <ShoppingCart className="w-5 h-5" />,
  transport: <Truck className="w-5 h-5" />,
};

const ENTITY_COLORS: Record<EntityType, string> = {
  offer: 'bg-accent/10 text-accent border-accent/20',
  purchase: 'bg-success/10 text-success border-success/20',
  transport: 'bg-warning/10 text-warning border-warning/20',
};

/**
 * Generic ResultGroup Component
 * 
 * Displays a collapsible group of search results by entity type.
 */
export function ResultGroup<T>({ title, entityType, results, renderItem }: ResultGroupProps<T>) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (results.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`p-2 rounded-lg ${ENTITY_COLORS[entityType]}`}>
            {ENTITY_ICONS[entityType]}
          </span>
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <Badge variant="secondary" className="font-mono">
            {results.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="border-t border-border divide-y divide-border">
          {results.map((item, index) => (
            <div key={index} className="p-4 hover:bg-muted/20 transition-colors">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Status badge variants
const STATUS_STYLES: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  sold: 'bg-muted text-muted-foreground border-border',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
  scheduled: 'bg-accent/10 text-accent border-accent/30',
  in_transit: 'bg-warning/10 text-warning border-warning/30',
  delivered: 'bg-success/10 text-success border-success/30',
};

const CONDITION_STYLES: Record<string, string> = {
  new: 'bg-success/10 text-success border-success/30',
  used: 'bg-muted text-muted-foreground border-border',
  certified: 'bg-accent/10 text-accent border-accent/30',
};

/**
 * OfferCard Component
 * Displays offer details with VIN, make, model, price, etc.
 */
export function OfferCard({ offer }: { offer: OfferResult }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-foreground">
            {offer.year} {offer.make} {offer.model}
          </h4>
          <Badge variant="outline" className={CONDITION_STYLES[offer.condition]}>
            {offer.condition}
          </Badge>
          <Badge variant="outline" className={STATUS_STYLES[offer.status]}>
            {offer.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            VIN: {offer.vin}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {offer.location}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-primary">
          ${offer.price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

/**
 * PurchaseCard Component
 * Displays purchase details with buyer info and related offer.
 */
export function PurchaseCard({ purchase }: { purchase: PurchaseResult }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-foreground">
            {purchase.purchaseId}
          </h4>
          <Badge variant="outline" className={STATUS_STYLES[purchase.status]}>
            {purchase.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
            {purchase.offerMake} {purchase.offerModel} • VIN: {purchase.offerVin}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {purchase.buyerName}
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            {purchase.buyerEmail}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {purchase.purchaseDate}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * TransportCard Component
 * Displays transport details with carrier info and locations.
 */
export function TransportCard({ transport }: { transport: TransportResult }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-foreground">
            {transport.transportId}
          </h4>
          <Badge variant="outline" className={STATUS_STYLES[transport.status]}>
            {transport.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Truck className="w-4 h-4" />
            {transport.carrierName}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {transport.carrierPhone}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {transport.scheduleDate}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {transport.pickupLocation}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {transport.deliveryLocation}
          </span>
        </div>
        {transport.relatedOfferVin && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">
            Related: {transport.relatedOfferModel} • VIN: {transport.relatedOfferVin}
          </div>
        )}
      </div>
    </div>
  );
}
