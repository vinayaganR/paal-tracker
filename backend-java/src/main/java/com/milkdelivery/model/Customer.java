package com.milkdelivery.model;

/**
 * Customer domain model representing a household receiving door-to-door milk delivery.
 */
public record Customer(
    String id,
    String name,
    String houseNo,
    String street,
    String phone,
    double defaultMorningQty,
    double defaultEveningQty,
    double ratePerLitre,
    int routeOrder,
    String notes,
    String status
) {
    public Customer withRouteOrder(int newOrder) {
        return new Customer(
            id, name, houseNo, street, phone,
            defaultMorningQty, defaultEveningQty, ratePerLitre,
            newOrder, notes, status
        );
    }
}
