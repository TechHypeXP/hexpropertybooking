/**
 * Event Store Implementation
 * @package HexPropertyBooking
 */

import { DomainEvent } from '@/domain/property/events/PropertyEvents';

export interface EventMetadata {
  id: string;
  timestamp: Date;
  aggregateId: string;
  aggregateType: string;
  version: number;
}

export interface StoredEvent {
  metadata: EventMetadata;
  payload: DomainEvent;
}

export interface EventStoreSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: Date;
}

export class EventStore {
  private events: Map<string, StoredEvent[]> = new Map();
  private snapshots: Map<string, EventStoreSnapshot> = new Map();

  async appendEvent(event: DomainEvent, aggregateId: string, aggregateType: string): Promise<void> {
    const metadata: EventMetadata = {
      id: event.id,
      timestamp: event.timestamp,
      aggregateId,
      aggregateType,
      version: this.getNextVersion(aggregateId)
    };

    const storedEvent: StoredEvent = {
      metadata,
      payload: event
    };

    if (!this.events.has(aggregateId)) {
      this.events.set(aggregateId, []);
    }

    this.events.get(aggregateId)!.push(storedEvent);
  }

  async getEventStream(aggregateId: string): Promise<StoredEvent[]> {
    return this.events.get(aggregateId) || [];
  }

  async createSnapshot(
    aggregateId: string, 
    aggregateType: string, 
    state: any
  ): Promise<void> {
    const snapshot: EventStoreSnapshot = {
      aggregateId,
      aggregateType,
      version: this.getLatestVersion(aggregateId),
      state,
      timestamp: new Date()
    };

    this.snapshots.set(aggregateId, snapshot);
  }

  async getLatestSnapshot(aggregateId: string): Promise<EventStoreSnapshot | undefined> {
    return this.snapshots.get(aggregateId);
  }

  async getEventsAfterSnapshot(
    aggregateId: string, 
    snapshotVersion: number
  ): Promise<StoredEvent[]> {
    const events = this.events.get(aggregateId) || [];
    return events.filter(event => event.metadata.version > snapshotVersion);
  }

  private getNextVersion(aggregateId: string): number {
    const events = this.events.get(aggregateId) || [];
    return events.length + 1;
  }

  private getLatestVersion(aggregateId: string): number {
    const events = this.events.get(aggregateId) || [];
    return events.length;
  }

  // Advanced querying capabilities
  async findEventsByType(eventType: string): Promise<StoredEvent[]> {
    const allEvents: StoredEvent[] = [];
    for (const eventStream of this.events.values()) {
      allEvents.push(...eventStream.filter(event => event.payload.type === eventType));
    }
    return allEvents;
  }

  async findEventsByAggregateType(aggregateType: string): Promise<StoredEvent[]> {
    const allEvents: StoredEvent[] = [];
    for (const eventStream of this.events.values()) {
      allEvents.push(...eventStream.filter(event => 
        event.metadata.aggregateType === aggregateType
      ));
    }
    return allEvents;
  }

  // Time-travel and replay capabilities
  async replayEventsUntil(
    aggregateId: string, 
    timestamp: Date
  ): Promise<StoredEvent[]> {
    const events = this.events.get(aggregateId) || [];
    return events.filter(event => event.metadata.timestamp <= timestamp);
  }
}

// Singleton event store for global usage
export const globalEventStore = new EventStore();
