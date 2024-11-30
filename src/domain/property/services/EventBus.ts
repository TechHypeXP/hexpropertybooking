/**
 * Event Bus Infrastructure
 * @package HexPropertyBooking
 */

import { DomainEvent } from '../events/PropertyEvents';

export interface EventSubscriber<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export class EventBus {
  private subscribers: Map<string, Set<EventSubscriber<any>>> = new Map();
  private deadLetterQueue: DomainEvent[] = [];

  subscribe<T extends DomainEvent>(eventType: string, subscriber: EventSubscriber<T>): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)?.add(subscriber);
  }

  unsubscribe<T extends DomainEvent>(eventType: string, subscriber: EventSubscriber<T>): void {
    this.subscribers.get(eventType)?.delete(subscriber);
  }

  async publish<T extends DomainEvent>(event: T, maxRetries: number = 3): Promise<void> {
    const subscribersForEvent = this.subscribers.get(event.type) || new Set();

    for (const subscriber of subscribersForEvent) {
      try {
        await this.processEventWithRetry(subscriber, event, maxRetries);
      } catch (error) {
        console.error(`Failed to process event after ${maxRetries} retries:`, event);
        this.addToDeadLetterQueue(event);
      }
    }
  }

  private async processEventWithRetry<T extends DomainEvent>(
    subscriber: EventSubscriber<T>, 
    event: T, 
    retriesLeft: number
  ): Promise<void> {
    try {
      await subscriber.handle(event);
    } catch (error) {
      if (retriesLeft > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Exponential backoff
        return this.processEventWithRetry(subscriber, event, retriesLeft - 1);
      }
      throw error;
    }
  }

  private addToDeadLetterQueue(event: DomainEvent): void {
    this.deadLetterQueue.push(event);
    // Optional: Implement persistent storage or external logging
    console.warn('Event added to dead-letter queue:', event);
  }

  getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  // Event sourcing and replay capabilities
  async replayEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

// Singleton instance for global event bus
export const globalEventBus = new EventBus();
