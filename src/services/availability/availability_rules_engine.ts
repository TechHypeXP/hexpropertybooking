import { TRPCError } from '@trpc/server'
import { AvailabilityRules, DateRange } from './types'

export class AvailabilityRulesEngine {
  private rules: AvailabilityRules

  constructor(rules: AvailabilityRules) {
    this.rules = rules
  }

  validateStayDuration(dateRange: DateRange) {
    const stayDuration = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Check seasonal rules first
    const month = dateRange.start.getMonth() + 1
    const seasonalRule = this.rules.seasonalRules?.find(
      rule => month >= rule.startMonth && month <= rule.endMonth
    )

    if (seasonalRule) {
      if (stayDuration < seasonalRule.minStayDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum stay during this season is ${seasonalRule.minStayDays} days`
        })
      }
      if (stayDuration > seasonalRule.maxStayDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum stay during this season is ${seasonalRule.maxStayDays} days`
        })
      }
    } else {
      // Apply default rules
      if (stayDuration < this.rules.minStayDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum stay is ${this.rules.minStayDays} days`
        })
      }
      if (stayDuration > this.rules.maxStayDays) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Maximum stay is ${this.rules.maxStayDays} days`
        })
      }
    }
  }

  validateAdvanceBooking(dateRange: DateRange) {
    const today = new Date()
    const daysInAdvance = Math.ceil(
      (dateRange.start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysInAdvance < this.rules.minAdvanceBookingDays) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Bookings must be made at least ${this.rules.minAdvanceBookingDays} days in advance`
      })
    }

    if (daysInAdvance > this.rules.maxAdvanceBookingDays) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Bookings cannot be made more than ${this.rules.maxAdvanceBookingDays} days in advance`
      })
    }
  }

  validateDaysOfWeek(dateRange: DateRange) {
    let currentDate = new Date(dateRange.start)
    while (currentDate <= dateRange.end) {
      const dayOfWeek = currentDate.getDay()
      if (!this.rules.allowedDaysOfWeek.includes(dayOfWeek)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Bookings not allowed on ${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}`
        })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  validateAll(dateRange: DateRange) {
    this.validateStayDuration(dateRange)
    this.validateAdvanceBooking(dateRange)
    this.validateDaysOfWeek(dateRange)
  }
}
