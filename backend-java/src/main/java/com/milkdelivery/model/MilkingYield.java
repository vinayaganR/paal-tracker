package com.milkdelivery.model;

/**
 * Daily cow milking yield tally tracking production vs distributed volume.
 */
public record MilkingYield(
    String date,
    int totalCows,
    double morningYield,
    double eveningYield,
    double fatPercentage,
    double snfPercentage,
    String notes
) {
    public double getTotalYield() {
        return morningYield + eveningYield;
    }
}
