import { faker } from '@faker-js/faker';

// Comprehensive test data generation utilities
export class TestDataGenerator {
  static property() {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      type: faker.helpers.arrayElement(['RESIDENTIAL', 'COMMERCIAL', 'VACATION']),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode()
      },
      amenities: faker.helpers.multiple(
        () => faker.lorem.word(), 
        { count: { min: 1, max: 5 } }
      ),
      status: faker.helpers.arrayElement(['AVAILABLE', 'BOOKED', 'MAINTENANCE'])
    };
  }

  static booking() {
    return {
      id: faker.string.uuid(),
      propertyId: faker.string.uuid(),
      userId: faker.string.uuid(),
      startDate: faker.date.future(),
      endDate: faker.date.future(),
      guests: faker.number.int({ min: 1, max: 10 }),
      status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'CANCELLED'])
    };
  }

  static user() {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(['ADMIN', 'USER', 'MANAGER'])
    };
  }
}

// Mocking utility for complex scenarios
export class MockFactory {
  static createMockRepository<T>(items: T[] = []) {
    return {
      findAll: vi.fn().mockResolvedValue(items),
      findById: vi.fn((id: string) => items.find(item => (item as any).id === id)),
      create: vi.fn((item: T) => {
        items.push(item);
        return item;
      }),
      update: vi.fn((id: string, updates: Partial<T>) => {
        const index = items.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...updates };
          return items[index];
        }
        return null;
      }),
      delete: vi.fn((id: string) => {
        const index = items.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          return items.splice(index, 1)[0];
        }
        return null;
      })
    };
  }

  static createMockLogger() {
    return {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };
  }
}

// Performance and stress testing utilities
export class TestStressUtility {
  static async runConcurrentTests(
    testFn: () => Promise<void>, 
    concurrency: number = 10, 
    iterations: number = 100
  ) {
    const promises = Array.from({ length: iterations }, () => 
      Promise.all(
        Array.from({ length: concurrency }, () => testFn())
      )
    );

    await Promise.all(promises);
  }

  static measureExecutionTime(fn: () => void): number {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }
}
