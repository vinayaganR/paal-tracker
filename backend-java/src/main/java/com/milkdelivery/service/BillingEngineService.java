package com.milkdelivery.service;

import com.milkdelivery.model.Customer;
import com.milkdelivery.model.DeliveryRecord;
import com.milkdelivery.model.MonthlyBill;
import com.milkdelivery.model.MonthlyBill.DailySummary;

import java.time.YearMonth;
import java.util.*;

/**
 * Enterprise billing engine for calculating precise monthly dairy statements,
 * resolving vacation pauses, extra litre variations, and outstanding balances.
 */
public class BillingEngineService {

    public MonthlyBill calculateMonthlyBill(
        String yearMonthStr,
        Customer customer,
        List<DeliveryRecord> monthRecords,
        long paidAmount
    ) {
        YearMonth ym = YearMonth.parse(yearMonthStr);
        int daysInMonth = ym.lengthOfMonth();

        // Group records by date
        Map<String, List<DeliveryRecord>> recordsByDate = new HashMap<>();
        for (DeliveryRecord r : monthRecords) {
            recordsByDate.computeIfAbsent(r.date(), k -> new ArrayList<>()).add(r);
        }

        double totalLitres = 0.0;
        int deliveredDays = 0;
        int skippedDays = 0;
        List<DailySummary> dailySummaries = new ArrayList<>();

        for (int day = 1; day <= daysInMonth; day++) {
            String dateStr = String.format("%s-%02d", yearMonthStr, day);
            List<DeliveryRecord> dayRecs = recordsByDate.getOrDefault(dateStr, Collections.emptyList());

            double dayLitres = 0.0;
            boolean hadDelivery = false;
            boolean hadSkip = false;

            for (DeliveryRecord r : dayRecs) {
                if (r.isDelivered()) {
                    dayLitres += r.litres();
                    hadDelivery = true;
                } else if (r.isSkipped()) {
                    hadSkip = true;
                }
            }

            // Fallback default if not explicitly marked skipped
            if (!hadDelivery && !hadSkip && dayRecs.isEmpty()) {
                // If it's a scheduled household, treat as default delivery
                dayLitres = customer.defaultMorningQty() + customer.defaultEveningQty();
                if (dayLitres > 0) {
                    hadDelivery = true;
                }
            }

            String status = hadDelivery ? "DELIVERED" : (hadSkip ? "SKIPPED" : "OFF");
            if (hadDelivery) {
                deliveredDays++;
                totalLitres += dayLitres;
            } else if (hadSkip) {
                skippedDays++;
            }

            dailySummaries.add(new DailySummary(dateStr, day, dayLitres, status));
        }

        // Round to 1 decimal place
        totalLitres = Math.round(totalLitres * 10.0) / 10.0;
        double rate = customer.ratePerLitre() > 0 ? customer.ratePerLitre() : 56.0;
        long totalAmount = Math.round(totalLitres * rate);
        long balanceDue = Math.max(0, totalAmount - paidAmount);

        String paymentStatus;
        if (totalAmount > 0 && balanceDue == 0) {
            paymentStatus = "PAID";
        } else if (paidAmount > 0) {
            paymentStatus = "PARTIAL";
        } else {
            paymentStatus = "PENDING";
        }

        return new MonthlyBill(
            yearMonthStr,
            customer,
            totalLitres,
            deliveredDays,
            skippedDays,
            rate,
            totalAmount,
            paidAmount,
            balanceDue,
            paymentStatus,
            dailySummaries
        );
    }
}
