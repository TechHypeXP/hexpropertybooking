/**
 * Advanced GraphQL Error Handling
 * @package HexPropertyBooking
 */

import { GraphQLError, GraphQLErrorExtensions } from 'graphql';
import { DomainError, ErrorCategory } from '@/core/errors/DomainErrors';
import { LoggerService, LogLevel } from '@/core/logging/LoggerService';

export enum GraphQLErrorType {
  VALIDATION = 'VALIDATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

export interface ExtendedErrorContext {
  code?: string;
  category?: ErrorCategory;
  suggestedAction?: string;
  retryAfter?: number;
}

export class GraphQLErrorHandler {
  private static instance: GraphQLErrorHandler;
  private logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.getInstance();
  }

  public static getInstance(): GraphQLErrorHandler {
    if (!GraphQLErrorHandler.instance) {
      GraphQLErrorHandler.instance = new GraphQLErrorHandler();
    }
    return GraphQLErrorHandler.instance;
  }

  private mapDomainErrorToGraphQLErrorType(
    error: DomainError
  ): GraphQLErrorType {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return GraphQLErrorType.VALIDATION;
      case ErrorCategory.AUTHORIZATION:
        return GraphQLErrorType.AUTHORIZATION;
      case ErrorCategory.NOT_FOUND:
        return GraphQLErrorType.NOT_FOUND;
      case ErrorCategory.CONFLICT:
        return GraphQLErrorType.CONFLICT;
      case ErrorCategory.SYSTEM:
        return GraphQLErrorType.SYSTEM;
      default:
        return GraphQLErrorType.UNKNOWN;
    }
  }

  public createGraphQLError(
    originalError: Error | DomainError,
    additionalContext: ExtendedErrorContext = {}
  ): GraphQLError {
    const isDomainError = originalError instanceof DomainError;
    
    const errorType = isDomainError 
      ? this.mapDomainErrorToGraphQLErrorType(originalError as DomainError)
      : GraphQLErrorType.UNKNOWN;

    const extensions: GraphQLErrorExtensions = {
      code: additionalContext.code || errorType,
      category: isDomainError 
        ? (originalError as DomainError).category 
        : ErrorCategory.SYSTEM,
      suggestedAction: additionalContext.suggestedAction,
      retryAfter: additionalContext.retryAfter,
      originalError: {
        name: originalError.name,
        message: originalError.message,
        stack: process.env.NODE_ENV !== 'production' 
          ? originalError.stack 
          : undefined
      }
    };

    // Log the error for monitoring
    this.logger.log(LogLevel.ERROR, 'GraphQL Error', {
      errorType,
      message: originalError.message,
      extensions
    });

    return new GraphQLError(
      originalError.message, 
      {
        extensions
      }
    );
  }

  public handleError(
    error: Error,
    additionalContext?: ExtendedErrorContext
  ): GraphQLError {
    return this.createGraphQLError(error, additionalContext);
  }

  public formatErrors(
    errors: ReadonlyArray<GraphQLError>
  ): ReadonlyArray<GraphQLError> {
    return errors.map(error => 
      this.handleError(
        error.originalError || error, 
        error.extensions as ExtendedErrorContext
      )
    );
  }

  public createValidationError(
    message: string, 
    context?: Record<string, unknown>
  ): GraphQLError {
    return this.createGraphQLError(
      new Error(message), 
      {
        code: GraphQLErrorType.VALIDATION,
        suggestedAction: 'Validate input and retry',
        category: ErrorCategory.VALIDATION,
        ...context
      }
    );
  }

  public createAuthorizationError(
    message: string, 
    context?: Record<string, unknown>
  ): GraphQLError {
    return this.createGraphQLError(
      new Error(message), 
      {
        code: GraphQLErrorType.AUTHORIZATION,
        suggestedAction: 'Check your permissions',
        category: ErrorCategory.AUTHORIZATION,
        ...context
      }
    );
  }

  public createNotFoundError(
    resourceType: string, 
    identifier: string
  ): GraphQLError {
    return this.createGraphQLError(
      new Error(`${resourceType} with identifier ${identifier} not found`), 
      {
        code: GraphQLErrorType.NOT_FOUND,
        suggestedAction: 'Verify the resource identifier',
        category: ErrorCategory.NOT_FOUND
      }
    );
  }
}

// GraphQL Error Handling Middleware
export const graphqlErrorHandler = (
  errors: ReadonlyArray<GraphQLError>
): ReadonlyArray<GraphQLError> => {
  const errorHandler = GraphQLErrorHandler.getInstance();
  return errorHandler.formatErrors(errors);
};
