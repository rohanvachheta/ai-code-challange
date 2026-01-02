import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserType, UserContext, USER_TYPE_LABELS, USER_TYPE_HINTS } from '@/types/search';
import { User, Building2, Truck, Shield } from 'lucide-react';
import { UserSearchSelector } from '@/components/UserSearchSelector';

interface UserContextFormProps {
  userContext: UserContext;
  onUserContextChange: (context: UserContext) => void;
}

const USER_TYPE_ICONS: Record<UserType, React.ReactNode> = {
  SELLER: <User className="w-4 h-4" />,
  BUYER: <Building2 className="w-4 h-4" />,
  CARRIER: <Truck className="w-4 h-4" />,
  AGENT: <Shield className="w-4 h-4" />,
};

/**
 * UserContextForm Component
 * 
 * Collects user type and identity information required for role-based
 * search filtering. These values are sent with every search request.
 */
export function UserContextForm({ userContext, onUserContextChange }: UserContextFormProps) {
  const handleUserTypeChange = (value: UserType) => {
    onUserContextChange({ ...userContext, userType: value });
  };

  const handleInputChange = (field: 'accountId' | 'userId', value: string) => {
    console.log(`UserContextForm: handleInputChange called - field: ${field}, value: ${value}`);
    const newContext = { ...userContext, [field]: value };
    console.log('UserContextForm: New context will be:', newContext);
    onUserContextChange(newContext);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* User Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">User Type</Label>
        <RadioGroup
          value={userContext.userType}
          onValueChange={(value) => handleUserTypeChange(value as UserType)}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {(Object.keys(USER_TYPE_LABELS) as UserType[]).map((type) => (
            <Label
              key={type}
              htmlFor={type}
              className={`
                flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${userContext.userType === type 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/50'
                }
              `}
            >
              <RadioGroupItem value={type} id={type} className="sr-only" />
              <span className={`
                p-2 rounded-lg transition-colors
                ${userContext.userType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {USER_TYPE_ICONS[type]}
              </span>
              <span className="font-medium">{USER_TYPE_LABELS[type]}</span>
            </Label>
          ))}
        </RadioGroup>
        
        {/* Role-aware hint */}
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2 border border-border/50">
          {USER_TYPE_HINTS[userContext.userType]}
        </p>
      </div>

      {/* Account & User Identifiers */}
      <div className="grid grid-cols-1 gap-4">
        {/* User Search Selector - replaces manual Account ID input */}
        <UserSearchSelector
          key={`user-search-${userContext.userType}`}
          label="Select User Account"
          placeholder={userContext.userType === "AGENT" ? "Search by name or email (optional)" : "Search by name or email (required)"}
          required={userContext.userType !== "AGENT"}
          userTypeFilter={userContext.userType !== "AGENT" ? userContext.userType : undefined}
          selectedUserId={userContext.accountId}
          onUserSelect={(userId, userName) => {
            // Update both accountId and userId in a single operation to avoid race condition
            const newContext = { 
              ...userContext, 
              accountId: userId, 
              userId: userId 
            };
            onUserContextChange(newContext);
          }}
          onClear={() => {
            onUserContextChange({ ...userContext, accountId: '', userId: '' });
          }}
        />
        
        {/* Show selected Account ID for reference */}
        {userContext.accountId && (
          <div className="bg-muted/30 border border-muted rounded-lg p-3">
            <Label className="text-xs font-medium text-muted-foreground">Selected Account ID:</Label>
            <p className="text-sm font-mono text-foreground mt-1">{userContext.accountId}</p>
          </div>
        )}
        
        {/* Fallback manual input for Account ID (for testing/admin purposes) */}
        <details className="space-y-2">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Advanced: Manual Account ID Entry
          </summary>
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <Label htmlFor="manualAccountId" className="text-sm font-medium text-foreground">
              Account ID (Manual Override)
            </Label>
            <Input
              id="manualAccountId"
              type="text"
              placeholder="Enter account ID directly"
              value={userContext.accountId}
              onChange={(e) => handleInputChange('accountId', e.target.value)}
              className="bg-background text-xs font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Use this only if the user search above doesn't work or for testing purposes.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}