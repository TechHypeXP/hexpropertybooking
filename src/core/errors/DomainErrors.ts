/**
 * Domain-Specific Error Handling
 * @package HexPropertyBooking
 */

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SYSTEM = 'SYSTEM'
}

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  context?: Record<string, unknown>;
}

export class DomainError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly context?: Record<string, unknown>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'DomainError';
    this.code = details.code;
    this.category = details.category;
    this.context = details.context;

    // Maintains proper stack trace for where it was thrown
    Object.setPrototypeOf(this, DomainError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      context: this.context
    };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      category: ErrorCategory.VALIDATION,
      context
    });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
      category: ErrorCategory.AUTHORIZATION,
      context
    });
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(resourceType: string, identifier: string) {
    super({
      code: 'RESOURCE_NOT_FOUND',
      message: `${resourceType} with identifier ${identifier} not found`,
      category: ErrorCategory.NOT_FOUND,
      context: { resourceType, identifier }
    });
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'CONFLICT_ERROR',
      message,
      category: ErrorCategory.CONFLICT,
      context
    });
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class SystemError extends DomainError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'SYSTEM_ERROR',
      message,
      category: ErrorCategory.SYSTEM,
      context
    });
    Object.setPrototypeOf(this, SystemError.prototype);
  }
}

// Error Factory for centralized error creation
export class ErrorFactory {
  static createValidationError(
    message: string, 
    context?: Record<string, unknown>
  ): ValidationError {
    return new ValidationError(message, context);
  }

  static createAuthorizationError(
    message: string, 
    context?: Record<string, unknown>
  ): AuthorizationError {
    return new AuthorizationError(message, context);
  }

  static createResourceNotFoundError(
    resourceType: string, 
    identifier: string
  ): ResourceNotFoundError {
    return new ResourceNotFoundError(resourceType, identifier);
  }

  static createConflictError(
    message: string, 
    context?: Record<string, unknown>
  ): ConflictError {
    return new ConflictError(message, context);
  }

  static createSystemError(
    message: string, 
    context?: Record<string, unknown>
  ): SystemError {
    return new SystemError(message, context);
  }
}
