/**
 * GraphQL Error Handler Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphQLError } from 'graphql';
import { 
  GraphQLErrorHandler, 
  GraphQLErrorType 
} from '@/graphql/errors/GraphQLErrorHandler';
import { 
  DomainError, 
  ErrorCategory, 
  ValidationError 
} from '@/core/errors/DomainErrors';

describe('GraphQLErrorHandler', () => {
  let errorHandler: GraphQLErrorHandler;

  beforeEach(() => {
    errorHandler = GraphQLErrorHandler.getInstance();
  });

  describe('Error Creation', () => {
    it('should create GraphQL error from standard error', () => {
      const standardError = new Error('Test Error');
      const graphqlError = errorHandler.createGraphQLError(standardError);

      expect(graphqlError).toBeInstanceOf(GraphQLError);
      expect(graphqlError.message).toBe('Test Error');
      expect(graphqlError.extensions?.code).toBe(GraphQLErrorType.UNKNOWN);
    });

    it('should create GraphQL error from domain error', () => {
      const domainError = new ValidationError('Validation Failed', {
        field: 'bedrooms'
      });
      const graphqlError = errorHandler.createGraphQLError(domainError);

      expect(graphqlError).toBeInstanceOf(GraphQLError);
      expect(graphqlError.message).toBe('Validation Failed');
      expect(graphqlError.extensions?.code).toBe(GraphQLErrorType.VALIDATION);
      expect(graphqlError.extensions?.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('Specific Error Types', () => {
    it('should create validation error', () => {
      const validationError = errorHandler.createValidationError(
        'Invalid input', 
        { field: 'bedrooms' }
      );

      expect(validationError.extensions?.code).toBe(GraphQLErrorType.VALIDATION);
      expect(validationError.extensions?.suggestedAction).toBe('Validate input and retry');
    });

    it('should create authorization error', () => {
      const authError = errorHandler.createAuthorizationError(
        'Unauthorized access', 
        { role: 'admin' }
      );

      expect(authError.extensions?.code).toBe(GraphQLErrorType.AUTHORIZATION);
      expect(authError.extensions?.suggestedAction).toBe('Check your permissions');
    });

    it('should create not found error', () => {
      const notFoundError = errorHandler.createNotFoundError(
        'Property', 
        'prop-123'
      );

      expect(notFoundError.extensions?.code).toBe(GraphQLErrorType.NOT_FOUND);
      expect(notFoundError.message).toContain('Property with identifier prop-123 not found');
    });
  });

  describe('Error Formatting', () => {
    it('should format multiple errors', () => {
      const errors = [
        new GraphQLError('Error 1'),
        new GraphQLError('Error 2', {
          extensions: {
            code: GraphQLErrorType.VALIDATION
          }
        })
      ];

      const formattedErrors = errorHandler.formatErrors(errors);

      expect(formattedErrors).toHaveLength(2);
      expect(formattedErrors[0].extensions?.code).toBe(GraphQLErrorType.UNKNOWN);
      expect(formattedErrors[1].extensions?.code).toBe(GraphQLErrorType.VALIDATION);
    });
  });

  describe('Error Context', () => {
    it('should include additional context', () => {
      const error = new Error('Test Error');
      const graphqlError = errorHandler.createGraphQLError(error, {
        suggestedAction: 'Retry operation',
        retryAfter: 5
      });

      expect(graphqlError.extensions?.suggestedAction).toBe('Retry operation');
      expect(graphqlError.extensions?.retryAfter).toBe(5);
    });
  });

  describe('Production Environment', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose stack trace in production', () => {
      const error = new Error('Sensitive Error');
      const graphqlError = errorHandler.createGraphQLError(error);

      expect(graphqlError.extensions?.originalError?.stack).toBeUndefined();
    });
  });
});
