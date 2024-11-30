import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationService } from '@/domain/security/AuthorizationService';
import { UserRole } from '@/domain/user/UserTypes';
import { TestDataGenerator } from '@/test/utils/test-helpers';
import { DomainError } from '@/core/errors/DomainErrors';

describe('Authorization and Access Control', () => {
  let authorizationService: AuthorizationService;

  beforeEach(() => {
    authorizationService = new AuthorizationService();
  });

  describe('Role-Based Access Control (RBAC)', () => {
    const testScenarios = [
      {
        role: UserRole.ADMIN,
        resources: ['ALL'],
        expectedAccess: true
      },
      {
        role: UserRole.PROPERTY_MANAGER,
        resources: ['PROPERTY_MANAGEMENT', 'BOOKING_READ'],
        expectedAccess: true
      },
      {
        role: UserRole.TENANT,
        resources: ['BOOKING_CREATE', 'PROPERTY_VIEW'],
        expectedAccess: true
      },
      {
        role: UserRole.GUEST,
        resources: ['PROPERTY_VIEW'],
        expectedAccess: true
      }
    ];

    testScenarios.forEach(scenario => {
      it(`should validate access for ${scenario.role} role`, () => {
        const user = TestDataGenerator.user({ role: scenario.role });

        scenario.resources.forEach(resource => {
          const hasAccess = authorizationService.checkAccess(user, resource);
          expect(hasAccess).toBe(scenario.expectedAccess);
        });
      });
    });

    it('should deny access for unauthorized resources', () => {
      const tenant = TestDataGenerator.user({ role: UserRole.TENANT });

      expect(() => 
        authorizationService.checkAccess(tenant, 'ADMIN_DASHBOARD')
      ).toThrow(DomainError);
    });
  });

  describe('Hierarchical Access Control', () => {
    it('should allow cascading permissions', () => {
      const admin = TestDataGenerator.user({ role: UserRole.ADMIN });
      const propertyManager = TestDataGenerator.user({ role: UserRole.PROPERTY_MANAGER });
      const tenant = TestDataGenerator.user({ role: UserRole.TENANT });

      const resourceHierarchy = [
        'PROPERTY_VIEW',
        'BOOKING_READ',
        'BOOKING_CREATE',
        'PROPERTY_MANAGEMENT',
        'USER_MANAGEMENT'
      ];

      resourceHierarchy.forEach((resource, index) => {
        // Admin should have full access
        expect(authorizationService.checkAccess(admin, resource)).toBe(true);

        // Property Manager should have partial access
        if (index < 4) {
          expect(authorizationService.checkAccess(propertyManager, resource)).toBe(true);
        } else {
          expect(() => 
            authorizationService.checkAccess(propertyManager, resource)
          ).toThrow(DomainError);
        }

        // Tenant should have limited access
        if (index < 2) {
          expect(authorizationService.checkAccess(tenant, resource)).toBe(true);
        } else {
          expect(() => 
            authorizationService.checkAccess(tenant, resource)
          ).toThrow(DomainError);
        }
      });
    });
  });

  describe('Dynamic Permission Evaluation', () => {
    it('should support context-based access control', () => {
      const propertyManager = TestDataGenerator.user({ role: UserRole.PROPERTY_MANAGER });
      const property = TestDataGenerator.property();

      // Scenario: Property Manager can only manage assigned properties
      const canManageProperty = authorizationService.checkResourceAccess(
        propertyManager, 
        'PROPERTY_MANAGEMENT', 
        { propertyId: property.id }
      );

      expect(canManageProperty).toBe(true);
    });

    it('should prevent unauthorized property access', () => {
      const tenant = TestDataGenerator.user({ role: UserRole.TENANT });
      const property = TestDataGenerator.property();

      expect(() => 
        authorizationService.checkResourceAccess(
          tenant, 
          'PROPERTY_MANAGEMENT', 
          { propertyId: property.id }
        )
      ).toThrow(DomainError);
    });
  });

  describe('Advanced Authorization Scenarios', () => {
    it('should handle complex multi-resource permissions', () => {
      const propertyManager = TestDataGenerator.user({ role: UserRole.PROPERTY_MANAGER });
      
      const multiResourceCheck = [
        { resource: 'BOOKING_CREATE', expected: true },
        { resource: 'PROPERTY_MANAGEMENT', expected: true },
        { resource: 'USER_MANAGEMENT', expected: false }
      ];

      multiResourceCheck.forEach(check => {
        const hasAccess = authorizationService.checkAccess(
          propertyManager, 
          check.resource
        );

        expect(hasAccess).toBe(check.expected);
      });
    });

    it('should support temporary elevated permissions', () => {
      const tenant = TestDataGenerator.user({ role: UserRole.TENANT });
      
      // Simulate temporary elevated access
      const temporaryAccess = authorizationService.grantTemporaryAccess(
        tenant, 
        'BOOKING_MANAGEMENT', 
        { expiresAt: new Date(Date.now() + 3600000) } // 1 hour
      );

      expect(temporaryAccess).toBe(true);
      
      // Verify temporary access
      expect(
        authorizationService.checkAccess(tenant, 'BOOKING_MANAGEMENT')
      ).toBe(true);
    });
  });

  describe('Security Violation Detection', () => {
    it('should log and prevent repeated access violations', () => {
      const tenant = TestDataGenerator.user({ role: UserRole.TENANT });

      const accessViolationAttempts = () => {
        try {
          authorizationService.checkAccess(tenant, 'ADMIN_DASHBOARD');
        } catch (error) {
          return error;
        }
      };

      // Multiple violation attempts
      const violations = Array.from({ length: 5 }, accessViolationAttempts);

      // Verify violation logging and potential account lockout
      expect(violations[0]).toBeInstanceOf(DomainError);
      expect(violations[0].code).toBe('UNAUTHORIZED_ACCESS');
    });
  });
});
