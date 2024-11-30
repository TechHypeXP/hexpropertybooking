import { describe, it, expect, beforeEach } from 'vitest';
import { PropertyRepository } from '@/domain/property/PropertyRepository';
import { TestDataGenerator, MockFactory } from '@/test/utils/test-helpers';
import { DomainError } from '@/core/errors/DomainErrors';

describe('PropertyRepository', () => {
  let propertyRepository: PropertyRepository;
  let mockDataStore: any;

  beforeEach(() => {
    // Create mock data store with test properties
    const testProperties = Array.from({ length: 5 }, () => 
      TestDataGenerator.property()
    );
    
    mockDataStore = MockFactory.createMockRepository(testProperties);
    
    // Instantiate repository with mock data store
    propertyRepository = new PropertyRepository(mockDataStore);
  });

  describe('Create Property', () => {
    it('should successfully create a new property', async () => {
      const newProperty = TestDataGenerator.property();
      
      const createdProperty = await propertyRepository.create(newProperty);
      
      expect(createdProperty).toEqual(expect.objectContaining(newProperty));
      expect(mockDataStore.create).toHaveBeenCalledWith(newProperty);
    });

    it('should throw validation error for invalid property', async () => {
      const invalidProperty = {
        ...TestDataGenerator.property(),
        name: '' // Invalid name
      };

      await expect(propertyRepository.create(invalidProperty))
        .rejects.toThrow(DomainError);
    });
  });

  describe('Find Properties', () => {
    it('should find property by ID', async () => {
      const testProperty = TestDataGenerator.property();
      mockDataStore.findById.mockResolvedValue(testProperty);

      const foundProperty = await propertyRepository.findById(testProperty.id);
      
      expect(foundProperty).toEqual(testProperty);
      expect(mockDataStore.findById).toHaveBeenCalledWith(testProperty.id);
    });

    it('should return null for non-existent property', async () => {
      mockDataStore.findById.mockResolvedValue(null);

      const foundProperty = await propertyRepository.findById('non-existent-id');
      
      expect(foundProperty).toBeNull();
    });

    it('should find properties by multiple criteria', async () => {
      const testProperties = [
        TestDataGenerator.property({ type: 'RESIDENTIAL', status: 'AVAILABLE' }),
        TestDataGenerator.property({ type: 'RESIDENTIAL', status: 'AVAILABLE' })
      ];

      const mockSearch = vi.fn().mockResolvedValue(testProperties);
      propertyRepository.search = mockSearch;

      const results = await propertyRepository.search({
        type: 'RESIDENTIAL',
        status: 'AVAILABLE'
      });

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('RESIDENTIAL');
      expect(results[0].status).toBe('AVAILABLE');
    });
  });

  describe('Update Property', () => {
    it('should update existing property', async () => {
      const existingProperty = TestDataGenerator.property();
      const updates = { name: 'Updated Property Name' };

      mockDataStore.update.mockImplementation((id, data) => ({
        ...existingProperty,
        ...data
      }));

      const updatedProperty = await propertyRepository.update(
        existingProperty.id, 
        updates
      );

      expect(updatedProperty.name).toBe('Updated Property Name');
      expect(mockDataStore.update).toHaveBeenCalledWith(
        existingProperty.id, 
        updates
      );
    });

    it('should throw error when updating non-existent property', async () => {
      mockDataStore.update.mockResolvedValue(null);

      await expect(
        propertyRepository.update('non-existent-id', { name: 'Test' })
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Delete Property', () => {
    it('should successfully delete a property', async () => {
      const propertyToDelete = TestDataGenerator.property();
      
      mockDataStore.delete.mockResolvedValue(propertyToDelete);

      const deletedProperty = await propertyRepository.delete(propertyToDelete.id);
      
      expect(deletedProperty).toEqual(propertyToDelete);
      expect(mockDataStore.delete).toHaveBeenCalledWith(propertyToDelete.id);
    });

    it('should throw error when deleting non-existent property', async () => {
      mockDataStore.delete.mockResolvedValue(null);

      await expect(
        propertyRepository.delete('non-existent-id')
      ).rejects.toThrow(DomainError);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle bulk property operations', async () => {
      const properties = Array.from({ length: 10 }, () => 
        TestDataGenerator.property()
      );

      const bulkCreateMock = vi.fn().mockResolvedValue(properties);
      propertyRepository.bulkCreate = bulkCreateMock;

      const createdProperties = await propertyRepository.bulkCreate(properties);

      expect(createdProperties).toHaveLength(10);
      expect(bulkCreateMock).toHaveBeenCalledWith(properties);
    });

    it('should apply complex filtering', async () => {
      const filteredProperties = [
        TestDataGenerator.property({ 
          type: 'RESIDENTIAL', 
          status: 'AVAILABLE',
          address: { city: 'New York' }
        })
      ];

      const complexSearchMock = vi.fn().mockResolvedValue(filteredProperties);
      propertyRepository.complexSearch = complexSearchMock;

      const results = await propertyRepository.complexSearch({
        type: 'RESIDENTIAL',
        status: 'AVAILABLE',
        location: { city: 'New York' },
        priceRange: { min: 1000, max: 5000 }
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('RESIDENTIAL');
      expect(results[0].address.city).toBe('New York');
    });
  });
});
