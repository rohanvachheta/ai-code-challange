import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserType, UserContext, USER_TYPE_LABELS, USER_TYPE_HINTS } from '@/types/search';
import { User, Building2, Truck, Shield } from 'lucide-react';

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
    onUserContextChange({ ...userContext, [field]: value });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accountId" className="text-sm font-medium text-foreground">
            Account ID
            {userContext.userType !== "AGENT" && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          <Input
            id="accountId"
            type="text"
            placeholder={userContext.userType === "AGENT" ? "Enter account ID (optional)" : "Enter account ID (required)"}
            value={userContext.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            className={`bg-background ${
              userContext.userType !== "AGENT" && !userContext.accountId.trim() 
                ? "border-red-300 focus:border-red-500" 
                : ""
            }`}
            required={userContext.userType !== "AGENT"}
          />
          />
        </div>
        {/* <div className="space-y-2">
          <Label htmlFor="userId" className="text-sm font-medium text-foreground">
            User ID
          </Label>
          <Input
            id="userId"
            type="text"
            placeholder="Enter user ID"
            value={userContext.userId}
            onChange={(e) => handleInputChange('userId', e.target.value)}
            className="bg-background"
          />
        </div> */}
      </div>
    </div>
  );
}
