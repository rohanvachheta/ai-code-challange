import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import { User, UserType } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(page = 1, limit = 10, userType?: UserType, search?: string): Promise<{ 
    users: User[]; 
    total: number; 
    pages: number 
  }> {
    const skip = (page - 1) * limit;
    const options: FindManyOptions<User> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    const where: any = {};
    
    if (userType) {
      where.userType = userType;
    }

    if (search) {
      // Search across multiple fields
      where.OR = [
        { firstName: ILike(`%${search}%`) },
        { lastName: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) },
        { phone: ILike(`%${search}%`) }
      ];
    }

    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [users, total] = await this.userRepository.findAndCount(options);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    return await this.userRepository.findByIds(ids);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  // Bulk create users (useful for seeding)
  async bulkCreate(users: CreateUserDto[]): Promise<User[]> {
    const entities = users.map(userData => this.userRepository.create(userData));
    return await this.userRepository.save(entities);
  }

  // Get user details for enriching other services
  async getUserDetails(userIds: string[]): Promise<{ [key: string]: Partial<User> }> {
    if (userIds.length === 0) return {};

    const users = await this.userRepository.find({
      where: { userId: userIds as any },
      select: ['userId', 'firstName', 'lastName', 'email', 'phone', 'userType']
    });

    const userMap: { [key: string]: Partial<User> } = {};
    users.forEach(user => {
      userMap[user.userId] = {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        fullName: `${user.firstName} ${user.lastName}`
      };
    });

    return userMap;
  }
}