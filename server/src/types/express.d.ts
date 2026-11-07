import { IUser, IUserSession } from '../models/User.model.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      session?: IUserSession;
      sessionId?: string;
    }
  }
}

