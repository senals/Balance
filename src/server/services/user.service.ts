import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { User } from '../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword, comparePasswords } from '../utils/password.utils';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await hashPassword(createUserDto.password);
    const user = {
      ...createUserDto,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return this.userRepository.create(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      return null;
    }

    const updateData: Partial<User> = {
      ...updateUserDto,
      updatedAt: new Date()
    };

    if (updateUserDto.password) {
      updateData.password = await hashPassword(updateUserDto.password);
    }

    return this.userRepository.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result !== null;
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await comparePasswords(password, user.password);
    return isValid ? user : null;
  }
} 