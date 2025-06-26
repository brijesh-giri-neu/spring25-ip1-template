import { Document } from 'mongoose';
import { User, SafeUser } from '../types/user';

/**
 * Type guard to determine if an object is a Mongoose document.
 *
 * @param obj - The object to test.
 * @returns True if it has a toObject() method.
 */
const isMongooseDoc = (obj: unknown): obj is Document & { toObject(): User } =>
  typeof obj === 'object' &&
  obj !== null &&
  'toObject' in obj &&
  typeof (obj as Document).toObject === 'function';

/**
 * Converts a User (or Mongoose document) to a SafeUser by omitting the password field.
 *
 * @param user - The user object or Mongoose document to convert.
 * @returns The safe user object without the password field.
 */
const userToSafeUser = (user: User | (Document & { toObject(): User })): SafeUser => {
  const userObject = isMongooseDoc(user) ? user.toObject() : { ...user };
  delete (userObject as Partial<User>).password;
  return userObject as SafeUser;
};

export default userToSafeUser;
