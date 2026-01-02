import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, User, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { userService, User as UserType } from '@/services/userService';
import { UserType as SearchUserType } from '@/types/search';

interface UserSearchSelectorProps {
  label: string;
  placeholder?: string;
  required?: boolean;
  userTypeFilter?: SearchUserType;
  selectedUserId?: string;
  onUserSelect: (userId: string, userName: string) => void;
  onClear?: () => void;
  className?: string;
}

/**
 * UserSearchSelector Component
 * 
 * Provides a searchable dropdown for user selection by name/email.
 * Returns the selected user's ID while displaying human-readable names.
 */
export function UserSearchSelector({
  label,
  placeholder = "Search by name or email...",
  required = false,
  userTypeFilter,
  selectedUserId,
  onUserSelect,
  onClear,
  className = ""
}: UserSearchSelectorProps) {
  const [searchText, setSearchText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load selected user details if selectedUserId is provided
  useEffect(() => {
    if (selectedUserId && selectedUserId !== selectedUser?.userId) {
      loadUserById(selectedUserId);
    } else if (!selectedUserId && selectedUser) {
      setSelectedUser(null);
    }
  }, [selectedUserId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users with debouncing
  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.searchUsers(query, userTypeFilter, 10);
      setUsers(response.users);
    } catch (err) {
      setError('Failed to search users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific user by ID
  const loadUserById = async (userId: string) => {
    try {
      const user = await userService.getUserById(userId);
      setSelectedUser(user);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setIsOpen(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Handle user selection
  const handleUserSelect = (user: UserType) => {
    console.log('UserSearchSelector: Selecting user', user);
    setSelectedUser(user);
    setSearchText('');
    setIsOpen(false);
    setUsers([]);
    const displayName = userService.formatUserDisplayName(user);
    console.log('UserSearchSelector: Calling onUserSelect with', user.userId, displayName);
    onUserSelect(user.userId, displayName);
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedUser(null);
    setSearchText('');
    setUsers([]);
    setIsOpen(false);
    onClear?.();
  };

  // Format user type badge color
  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'SELLER': return 'bg-blue-100 text-blue-700';
      case 'BUYER': return 'bg-green-100 text-green-700';
      case 'CARRIER': return 'bg-orange-100 text-orange-700';
      case 'AGENT': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected User Display */}
        {selectedUser ? (
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {selectedUser.email}
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getUserTypeBadgeColor(selectedUser.userType)}`}
                  >
                    {selectedUser.userType}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* Search Input */
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-10"
              required={required}
            />
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
        )}

        {/* Dropdown Results */}
        {isOpen && !selectedUser && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching users...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchText.trim().length < 2 
                  ? 'Type at least 2 characters to search' 
                  : 'No users found'
                }
              </div>
            ) : (
              <div className="py-2">
                {users.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 focus:bg-muted focus:outline-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs mt-1 ${getUserTypeBadgeColor(user.userType)}`}
                        >
                          {user.userType}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation Error */}
      {required && !selectedUser && (
        <p className="text-xs text-red-500">
          Please select a user
        </p>
      )}
    </div>
  );
}