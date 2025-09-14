import { ObjectId } from "mongoose";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        id?: ObjectId;
      }
    }
  }
}
