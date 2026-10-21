package com.milkdelivery.model;

import java.util.List;

/**
 * Calculated monthly bill ledger item per customer.
 */
public record MonthlyBill(
    String month,            // "YYYY-MM"
    Customer customer,
    double totalLitres,
    int deliveredDays,
    int skippedDays,
    double ratePerLitre,
    long totalAmount,
    long paidAmount,
    long balanceDue,
    String paymentStatus,    // "PAID", "PARTIAL", "PENDING"
    List<DailySummary> dailySummaries
) {
    public record DailySummary(
        String date,
        int dayOfMonth,
        double litres,
        String status
    ) {}
}
