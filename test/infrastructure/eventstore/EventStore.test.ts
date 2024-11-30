/**
 * Event Store Test Suite
 * @package HexPropertyBooking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore } from '@/infrastructure/eventstore/EventStore';
import { PropertyCreatedEvent } from '@/domain/property/events/PropertyEvents';
import { PropertyId, BuildingId } from '@/domain/property/types';

describe('EventStore', () => {
  let eventStore: EventStore;

  beforeEach(() => {
    eventStore = new EventStore();
  });

  describe('Event Appending', () => {
    it('should append events to event stream', async () => {
      const event = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );

      await eventStore.appendEvent(event, 'prop-123', 'Property');

      const events = await eventStore.getEventStream('prop-123');
      expect(events).toHaveLength(1);
      expect(events[0].payload).toEqual(event);
      expect(events[0].metadata.version).toBe(1);
    });

    it('should increment version for multiple events', async () => {
      const event1 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );
      const event2 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        3, 
        4, 
        'B402'
      );

      await eventStore.appendEvent(event1, 'prop-123', 'Property');
      await eventStore.appendEvent(event2, 'prop-123', 'Property');

      const events = await eventStore.getEventStream('prop-123');
      expect(events).toHaveLength(2);
      expect(events[0].metadata.version).toBe(1);
      expect(events[1].metadata.version).toBe(2);
    });
  });

  describe('Snapshot Management', () => {
    it('should create and retrieve snapshots', async () => {
      const aggregateState = { 
        id: 'prop-123', 
        bedrooms: 2 
      };

      await eventStore.createSnapshot(
        'prop-123', 
        'Property', 
        aggregateState
      );

      const snapshot = await eventStore.getLatestSnapshot('prop-123');
      expect(snapshot).toBeDefined();
      expect(snapshot?.state).toEqual(aggregateState);
    });

    it('should retrieve events after snapshot', async () => {
      const event1 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );
      const event2 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        3, 
        4, 
        'B402'
      );

      await eventStore.appendEvent(event1, 'prop-123', 'Property');
      await eventStore.createSnapshot('prop-123', 'Property', { version: 1 });
      await eventStore.appendEvent(event2, 'prop-123', 'Property');

      const eventsAfterSnapshot = await eventStore.getEventsAfterSnapshot('prop-123', 1);
      expect(eventsAfterSnapshot).toHaveLength(1);
      expect(eventsAfterSnapshot[0].payload).toEqual(event2);
    });
  });

  describe('Advanced Querying', () => {
    it('should find events by type', async () => {
      const event1 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );
      const event2 = new PropertyCreatedEvent(
        'prop-456' as PropertyId, 
        'building-789' as BuildingId, 
        3, 
        4, 
        'B402'
      );

      await eventStore.appendEvent(event1, 'prop-123', 'Property');
      await eventStore.appendEvent(event2, 'prop-456', 'Property');

      const events = await eventStore.findEventsByType('PropertyCreated');
      expect(events).toHaveLength(2);
    });

    it('should find events by aggregate type', async () => {
      const event1 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );
      const event2 = new PropertyCreatedEvent(
        'prop-456' as PropertyId, 
        'building-789' as BuildingId, 
        3, 
        4, 
        'B402'
      );

      await eventStore.appendEvent(event1, 'prop-123', 'Property');
      await eventStore.appendEvent(event2, 'prop-456', 'Property');

      const events = await eventStore.findEventsByAggregateType('Property');
      expect(events).toHaveLength(2);
    });
  });

  describe('Time Travel', () => {
    it('should replay events until specific timestamp', async () => {
      const event1 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        2, 
        3, 
        'A301'
      );
      const event2 = new PropertyCreatedEvent(
        'prop-123' as PropertyId, 
        'building-456' as BuildingId, 
        3, 
        4, 
        'B402'
      );

      await eventStore.appendEvent(event1, 'prop-123', 'Property');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await eventStore.appendEvent(event2, 'prop-123', 'Property');

      const events = await eventStore.getEventStream('prop-123');
      const replayEvents = await eventStore.replayEventsUntil(
        'prop-123', 
        events[0].metadata.timestamp
      );

      expect(replayEvents).toHaveLength(1);
      expect(replayEvents[0].payload).toEqual(event1);
    });
  });
});
