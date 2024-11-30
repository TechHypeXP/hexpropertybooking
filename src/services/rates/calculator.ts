import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { BookingRuleSchema } from '../../models/booking'
import { UnitTypeSchema } from '../../models/property'

export const RateRequestSchema = z.object({
  propertyId: z.string().uuid(),
  unitTypeId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  occupancy: z.object({
    adults: z.number(),
    children: z.number().optional()
  }),
  channelId: z.string().optional(),
  ratePlanId: z.string().uuid().optional()
})

export const RateResponseSchema = z.object({
  baseTotal: z.number(),
  adjustments: z.array(z.object({
    type: z.string(),
    description: z.string(),
    amount: z.number()
  })),
  taxes: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    amount: z.number()
  })),
  total: z.number(),
  breakdown: z.array(z.object({
    date: z.date(),
    baseRate: z.number(),
    adjustments: z.array(z.object({
      type: z.string(),
      description: z.string(),
      amount: z.number()
    })),
    total: z.number()
  }))
})

export class RateCalculator {
  private async getUnitType(unitTypeId: string) {
    // TODO: Implement fetching unit type
  }

  private async getBookingRules(
    unitTypeId: string,
    startDate: Date,
    endDate: Date
  ) {
    // TODO: Implement fetching booking rules
  }

  private async getRatePlan(ratePlanId: string) {
    // TODO: Implement fetching rate plan
  }

  private async getTaxRules(propertyId: string) {
    // TODO: Implement fetching tax rules
  }

  private calculateDailyRate(
    baseRate: number,
    date: Date,
    rules: z.infer<typeof BookingRuleSchema>[],
    channelId?: string
  ) {
    let rate = baseRate

    // Apply rule-based adjustments
    for (const rule of rules) {
      if (
        date >= rule.dateRange.startDate &&
        date <= rule.dateRange.endDate &&
        rule.daysOfWeek.includes(date.getDay())
      ) {
        rate *= rule.rates.rateMultiplier

        // Apply channel-specific adjustments
        if (channelId) {
          const channelRule = rule.channelRestrictions.find(
            cr => cr.channelId === channelId
          )
          if (channelRule) {
            rate *= channelRule.rateMultiplier
          }
        }
      }
    }

    // Apply rate constraints
    for (const rule of rules) {
      if (rule.rates.minimumRate) {
        rate = Math.max(rate, rule.rates.minimumRate)
      }
      if (rule.rates.maximumRate) {
        rate = Math.min(rate, rule.rates.maximumRate)
      }
    }

    return rate
  }

  private calculateExtraPersonCharges(
    adults: number,
    children: number,
    unitType: z.infer<typeof UnitTypeSchema>,
    date: Date
  ) {
    const adjustments = []
    const totalGuests = adults + children

    if (
      totalGuests > 2 &&
      unitType.rates?.extraPersonRate
    ) {
      adjustments.push({
        type: 'EXTRA_PERSON',
        description: 'Extra person charge',
        amount: unitType.rates.extraPersonRate * (totalGuests - 2)
      })
    }

    return adjustments
  }

  private calculateTaxes(
    amount: number,
    taxes: Array<{
      name: string
      rate: number
    }>
  ) {
    return taxes.map(tax => ({
      name: tax.name,
      rate: tax.rate,
      amount: amount * tax.rate
    }))
  }

  async calculateRates(request: z.infer<typeof RateRequestSchema>) {
    try {
      const {
        propertyId,
        unitTypeId,
        startDate,
        endDate,
        occupancy,
        channelId,
        ratePlanId
      } = request

      // Get required data
      const unitType = await this.getUnitType(unitTypeId)
      if (!unitType) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Unit type not found'
        })
      }

      const rules = await this.getBookingRules(
        unitTypeId,
        startDate,
        endDate
      )

      const ratePlan = ratePlanId
        ? await this.getRatePlan(ratePlanId)
        : undefined

      const taxes = await this.getTaxRules(propertyId)

      // Calculate daily rates
      const breakdown = []
      let currentDate = new Date(startDate)
      let baseTotal = 0

      while (currentDate <= endDate) {
        // Calculate base rate
        const baseRate = this.calculateDailyRate(
          ratePlan?.baseRate || unitType.basePrice,
          currentDate,
          rules,
          channelId
        )

        // Calculate adjustments
        const adjustments = this.calculateExtraPersonCharges(
          occupancy.adults,
          occupancy.children || 0,
          unitType,
          currentDate
        )

        // Calculate daily total
        const dailyTotal =
          baseRate +
          adjustments.reduce((sum, adj) => sum + adj.amount, 0)

        baseTotal += dailyTotal

        breakdown.push({
          date: new Date(currentDate),
          baseRate,
          adjustments,
          total: dailyTotal
        })

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Calculate taxes
      const taxDetails = this.calculateTaxes(baseTotal, taxes)
      const taxTotal = taxDetails.reduce(
        (sum, tax) => sum + tax.amount,
        0
      )

      // Compile response
      return {
        baseTotal,
        adjustments: breakdown.flatMap(b => b.adjustments),
        taxes: taxDetails,
        total: baseTotal + taxTotal,
        breakdown
      }

    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error calculating rates',
        cause: error
      })
    }
  }
}
