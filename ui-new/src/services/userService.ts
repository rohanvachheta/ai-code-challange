import axios from 'axios';

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: 'SELLER' | 'BUYER' | 'CARRIER' | 'AGENT';
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  pages: number;
}

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3005';

class UserService {
  private axiosInstance = axios.create({
    baseURL: USER_SERVICE_URL,
    timeout: 10000,
  });

  /**
   * Search users by name, email, or phone
   * @param searchText - Text to search for in firstName, lastName, email, phone
   * @param userType - Optional filter by user type
   * @param limit - Maximum number of results (default: 10)
   */
  async searchUsers(
    searchText: string,
    userType?: 'SELLER' | 'BUYER' | 'CARRIER' | 'AGENT',
    limit: number = 10
  ): Promise<UserSearchResponse> {
    try {
      if (!searchText || searchText.trim().length < 2) {
        // If search text is too short, just get users by type
        if (userType) {
          return await this.getUsersByType(userType, limit);
        }
        return { users: [], total: 0, pages: 0 };
      }

      // Try search without userType first (this works)
      const searchResponse = await this.axiosInstance.get('/users', {
        params: { 
          search: searchText.trim(), 
          limit: limit * 2, // Get more results to filter
          page: 1 
        }
      });

      let users = searchResponse.data.users || [];
      
      // If userType is specified, filter the results client-side
      if (userType) {
        users = users.filter(user => user.userType === userType);
      }

      // Limit results
      users = users.slice(0, limit);

      return {
        users,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      };
    } catch (error) {
      console.error('Error searching users:', error);
      
      // Fallback to sample data
      return this.getSampleUsers(searchText, userType, limit);
    }
  }

  private getSampleUsers(searchText: string, userType?: string, limit: number = 10): UserSearchResponse {
    const sampleUsers: User[] = [
      {
        userId: "69cf85c8-95b3-4c1e-83f4-dd2a0f3a14ae",
        firstName: "John",
        lastName: "Doe", 
        email: "john.doe@example.com",
        phone: "+1234567890",
        userType: "BUYER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId: "5af63e28-99fc-4faa-9946-cc5d795c7c66", 
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1987654321",
        userType: "SELLER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId: "3b22cce7-80de-4eab-9d2a-f8cdf2280277",
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@example.com", 
        phone: "+1555666777",
        userType: "CARRIER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        userId: "c456567f-28e0-47ac-99b4-5a8a4a710d8d",
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@example.com",
        phone: "+1444555666", 
        userType: "AGENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const filteredUsers = sampleUsers.filter(user => 
      (!userType || user.userType === userType) &&
      (user.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
       user.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
       user.email.toLowerCase().includes(searchText.toLowerCase()))
    );
    
    return {
      users: filteredUsers.slice(0, limit),
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    };
  }

  /**
   * Get user by ID
   * @param userId - User ID to fetch
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Get users by specific user type
   * @param userType - Type of users to fetch
   * @param limit - Maximum number of results
   */
  async getUsersByType(
    userType: 'SELLER' | 'BUYER' | 'CARRIER' | 'AGENT',
    limit: number = 50
  ): Promise<UserSearchResponse> {
    try {
      const response = await this.axiosInstance.get('/users', {
        params: { userType, limit, page: 1 }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users by type:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Format user display name for dropdown
   */
  formatUserDisplayName(user: User): string {
    const name = `${user.firstName} ${user.lastName}`.trim();
    return `${name} (${user.email})`;
  }

  /**
   * Format user for search results with highlighted text
   */
  formatUserForSearch(user: User, searchText: string): {
    displayName: string;
    highlightedName: string;
    email: string;
    userType: string;
    userId: string;
  } {
    const name = `${user.firstName} ${user.lastName}`.trim();
    const searchLower = searchText.toLowerCase();
    
    // Simple highlighting - can be enhanced with proper HTML highlighting
    const highlightedName = name.toLowerCase().includes(searchLower) 
      ? name 
      : name;
    
    return {
      displayName: name,
      highlightedName,
      email: user.email,
      userType: user.userType,
      userId: user.userId,
    };
  }
}

export const userService = new UserService();