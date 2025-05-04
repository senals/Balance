import { User } from '../models/user.model';
import { MongoClient, ObjectId } from 'mongodb';

export class UserRepository {
  private collection = 'users';

  constructor(private client: MongoClient) {}

  async findAll(): Promise<User[]> {
    const db = this.client.db();
    return db.collection<User>(this.collection).find().toArray();
  }

  async findById(id: string): Promise<User | null> {
    const db = this.client.db();
    return db.collection<User>(this.collection).findOne({ _id: new ObjectId(id) });
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = this.client.db();
    return db.collection<User>(this.collection).findOne({ email });
  }

  async create(user: Omit<User, '_id'>): Promise<User> {
    const db = this.client.db();
    const result = await db.collection<User>(this.collection).insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async update(id: string, updateData: Partial<User>): Promise<User | null> {
    const db = this.client.db();
    const result = await db.collection<User>(this.collection).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async delete(id: string): Promise<User | null> {
    const db = this.client.db();
    const result = await db.collection<User>(this.collection).findOneAndDelete({
      _id: new ObjectId(id)
    });
    return result.value;
  }
} 