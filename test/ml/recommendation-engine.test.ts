import { describe, it, expect, beforeEach } from 'vitest';
import { recommendationEngine } from '@/src/ml/recommendation-engine';
import { z } from 'zod';

// Test Data Generators
const generateTestUser = (overrides = {}) => ({
  id: crypto.randomUUID(),
  preferences: {
    propertyTypes: ['RESIDENTIAL'],
    priceRange: { min: 1000, max: 5000 },
    amenities: ['WIFI', 'PARKING'],
    location: { city: 'TestCity', country: 'TestCountry' }
  },
  bookingHistory: [
    { 
      propertyId: crypto.randomUUID(), 
      duration: 7, 
      rating: 4 
    }
  ],
  ...overrides
});

const generateTestProperty = (overrides = {}) => ({
  id: crypto.randomUUID(),
  type: 'RESIDENTIAL',
  price: 2500,
  amenities: ['WIFI', 'PARKING', 'GYM'],
  location: {
    city: 'TestCity',
    country: 'TestCountry',
    coordinates: { lat: 0, lon: 0 }
  },
  bookingHistory: [
    { 
      userId: crypto.randomUUID(), 
      duration: 5, 
      rating: 4.5 
    }
  ],
  ...overrides
});

describe('Recommendation Engine', () => {
  let testUser: ReturnType<typeof generateTestUser>;
  let testProperties: ReturnType<typeof generateTestProperty>[];

  beforeEach(() => {
    testUser = generateTestUser();
    testProperties = [
      generateTestProperty(),
      generateTestProperty({ 
        price: 6000, 
        type: 'COMMERCIAL' 
      }),
      generateTestProperty({ 
        location: { 
          city: 'DifferentCity', 
          country: 'DifferentCountry' 
        } 
      })
    ];
  });

  describe('Recommendation Scoring', () => {
    it('should generate recommendations with scores', () => {
      const recommendations = recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].score).toBeGreaterThan(0);
      expect(recommendations[0].score).toBeLessThanOrEqual(1);
    });

    it('should prioritize properties matching user preferences', () => {
      const recommendations = recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      // First recommendation should be most aligned with user preferences
      const topRecommendation = recommendations[0];
      const topProperty = testProperties.find(
        p => p.id === topRecommendation.propertyId
      );

      expect(topProperty?.type).toBe('RESIDENTIAL');
      expect(topProperty?.price).toBeLessThan(5000);
      expect(topProperty?.location.city).toBe('TestCity');
    });
  });

  describe('Model Training', () => {
    it('should train recommendation model', async () => {
      const trainingResult = await recommendationEngine.trainModel(
        [testUser], 
        testProperties
      );

      expect(trainingResult).toHaveProperty('accuracy');
      expect(trainingResult).toHaveProperty('loss');
      expect(trainingResult.accuracy).toBeGreaterThanOrEqual(0);
      expect(trainingResult.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle empty property list', () => {
      const recommendations = recommendationEngine.recommendProperties(
        testUser, 
        []
      );

      expect(recommendations).toHaveLength(0);
    });

    it('should handle user with no preferences', () => {
      const genericUser = generateTestUser({
        preferences: {
          propertyTypes: [],
          priceRange: { min: 0, max: 0 },
          amenities: [],
          location: { city: '', country: '' }
        }
      });

      const recommendations = recommendationEngine.recommendProperties(
        genericUser, 
        testProperties
      );

      expect(recommendations).toHaveLength(3);
    });
  });
});
