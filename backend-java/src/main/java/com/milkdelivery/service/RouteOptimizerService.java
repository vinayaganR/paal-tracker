package com.milkdelivery.service;

import com.milkdelivery.model.Customer;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Route Sequence Optimization Service to arrange 5:00 AM delivery houses
 * by street order and neighborhood clusters, minimizing delivery fatigue.
 */
public class RouteOptimizerService {

    public List<Customer> optimizeDeliverySequence(List<Customer> customerList) {
        if (customerList == null || customerList.isEmpty()) {
            return Collections.emptyList();
        }

        // Sort by explicit routeOrder ascending; fallback to street name and house number
        return customerList.stream()
            .sorted(Comparator
                .comparingInt(Customer::routeOrder)
                .thenComparing(Customer::street)
                .thenComparing(Customer::houseNo))
            .collect(Collectors.toList());
    }

    public Map<String, Double> calculateShiftDemand(List<Customer> customers, String shift) {
        double totalDemand = 0.0;
        int activeHouses = 0;

        for (Customer c : customers) {
            double qty = "MORNING".equalsIgnoreCase(shift) 
                ? c.defaultMorningQty() 
                : c.defaultEveningQty();
            if (qty > 0) {
                totalDemand += qty;
                activeHouses++;
            }
        }

        Map<String, Double> summary = new LinkedHashMap<>();
        summary.put("totalLitres", Math.round(totalDemand * 10.0) / 10.0);
        summary.put("activeHouses", (double) activeHouses);
        // Estimate cans needed (standard 20L or 10L steel milk cans)
        summary.put("20LitreCansNeeded", Math.ceil(totalDemand / 20.0));
        return summary;
    }
}
