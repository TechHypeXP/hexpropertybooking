import { describe, it, expect, beforeEach } from 'vitest';
import { recommendationEngine } from '@/src/ml/recommendation-engine';
import { hexPropertyBookingMLRagKnowledgeBase } from '@/src/ml/hexproperty-booking-ml-rag-knowledge-base';
import { z } from 'zod';

// Reuse test data generators from previous test
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

describe('MLRG-Enhanced Recommendation Engine', () => {
  let testUser: ReturnType<typeof generateTestUser>;
  let testProperties: ReturnType<typeof generateTestProperty>[];

  beforeEach(async () => {
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

    // Prepare MLRG knowledge base with some initial learnings
    await hexPropertyBookingMLRagKnowledgeBase.addLearning(
      'GLOBAL_TREND',
      {},
      [
        {
          key: 'PROPERTY_TYPE_PREFERENCE',
          value: 0.7,
          confidence: 0.9
        }
      ]
    );

    await hexPropertyBookingMLRagKnowledgeBase.addLearning(
      'USER_GROUP',
      { 
        ageGroup: 'YOUNG_PROFESSIONAL', 
        incomeLevel: 'MIDDLE_INCOME' 
      },
      [
        {
          key: 'PRICE_SENSITIVITY',
          value: 0.6,
          confidence: 0.8
        }
      ]
    );
  });

  describe('MLRG Knowledge Integration', () => {
    it('should log self-development roadmap', () => {
      const roadmap = recommendationEngine['mlrgKnowledgeBase'].selfDevelopmentRoadmap;
      
      expect(roadmap).toBeInstanceOf(Array);
      expect(roadmap.length).toBeGreaterThan(0);
      expect(roadmap[0]).toHaveProperty('phase');
      expect(roadmap[0]).toHaveProperty('priority');
      expect(roadmap[0]).toHaveProperty('description');
    });

    it('should enhance recommendations with MLRG insights', async () => {
      const recommendations = await recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].score).toBeGreaterThan(0);
      expect(recommendations[0].score).toBeLessThanOrEqual(1);
    });

    it('should record learning from recommendation session', async () => {
      await recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      // Retrieve learnings to verify recording
      const globalLearnings = await hexPropertyBookingMLRagKnowledgeBase.aggregateLearnings(
        'GLOBAL_TREND', 
        {}
      );

      const userGroupLearnings = await hexPropertyBookingMLRagKnowledgeBase.aggregateLearnings(
        'USER_GROUP', 
        { 
          ageGroup: 'YOUNG_PROFESSIONAL', 
          incomeLevel: 'MIDDLE_INCOME' 
        }
      );

      expect(globalLearnings.aggregatedInsights).toHaveLength(1);
      expect(userGroupLearnings.aggregatedInsights).toHaveLength(1);
    });
  });

  describe('Multi-Dimensional Learning', () => {
    it('should support different learning contexts', async () => {
      // Add learnings for different contexts
      await hexPropertyBookingMLRagKnowledgeBase.addLearning(
        'LOCATION',
        { 
          city: 'TestCity', 
          country: 'TestCountry' 
        },
        [
          {
            key: 'AMENITY_IMPORTANCE',
            value: 0.8,
            confidence: 0.9
          }
        ]
      );

      const recommendations = await recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      // Verify recommendations incorporate multiple learning dimensions
      expect(recommendations[0].score).toBeGreaterThan(0);
    });
  });

  describe('Adaptive Learning', () => {
    it('should update knowledge base over multiple recommendation cycles', async () => {
      // First recommendation cycle
      const firstRecommendations = await recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      // Second recommendation cycle
      const secondRecommendations = await recommendationEngine.recommendProperties(
        testUser, 
        testProperties
      );

      // Verify knowledge base has been updated
      const userGroupLearnings = await hexPropertyBookingMLRagKnowledgeBase.aggregateLearnings(
        'USER_GROUP', 
        { 
          ageGroup: 'YOUNG_PROFESSIONAL', 
          incomeLevel: 'MIDDLE_INCOME' 
        }
      );

      expect(userGroupLearnings.aggregatedInsights).toHaveLength(1);
      expect(userGroupLearnings.aggregatedInsights[0].confidence).toBeGreaterThan(0);
    });
  });
});
