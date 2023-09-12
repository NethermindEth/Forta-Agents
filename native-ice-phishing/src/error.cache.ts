import { Finding } from "forta-agent";

class ErrorCache {
  private static errors: Finding[] = [];

  static add(error: Finding) {
    ErrorCache.errors.push(error);
  }

  static getAll(): Finding[] {
    return ErrorCache.errors;
  }

  static clear() {
    ErrorCache.errors = [];
  }

  static len(): number {
    return ErrorCache.errors.length;
  }
}

export default ErrorCache;
