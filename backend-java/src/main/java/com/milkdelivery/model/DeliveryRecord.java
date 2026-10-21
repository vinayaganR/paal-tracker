package com.milkdelivery.model;

/**
 * Daily delivery status record for a customer on a specific date and shift.
 */
public record DeliveryRecord(
    String id,
    String customerId,
    String date,
    String shift,        // "MORNING" or "EVENING"
    String status,       // "DELIVERED", "SKIPPED", "PENDING"
    double litres,
    double extraLitres,
    String deliveredTime,
    String note
) {
    public boolean isDelivered() {
        return "DELIVERED".equalsIgnoreCase(status);
    }

    public boolean isSkipped() {
        return "SKIPPED".equalsIgnoreCase(status);
    }
}
