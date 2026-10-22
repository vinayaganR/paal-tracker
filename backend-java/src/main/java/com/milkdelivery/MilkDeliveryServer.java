package com.milkdelivery;

import com.milkdelivery.model.Customer;
import com.milkdelivery.model.MonthlyBill;
import com.milkdelivery.service.BillingEngineService;
import com.milkdelivery.service.InvoiceFormatterService;
import com.milkdelivery.service.RouteOptimizerService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Enterprise Java 21 REST Server for Farm Milk Delivery Management.
 * Runs standalone without requiring external Maven installation.
 */
public class MilkDeliveryServer {

    private static final int PORT = 8080;
    private static final BillingEngineService billingService = new BillingEngineService();
    private static final RouteOptimizerService routeService = new RouteOptimizerService();
    private static final InvoiceFormatterService invoiceService = new InvoiceFormatterService();

    private static final List<Customer> SAMPLE_CUSTOMERS = List.of(
        new Customer("cust_1", "முத்துசாமி (Muthusamy)", "14/A", "பாரதியார் வீதி", "9840112345", 1.0, 0.5, 56.0, 1, "கேட்டில் உள்ள பாத்திரத்தில் ஊற்றவும்", "ACTIVE"),
        new Customer("cust_2", "சுந்தரம் ஆசிரியர் (Sundaram)", "28", "பாரதியார் வீதி", "9789223456", 1.5, 0.0, 56.0, 2, "மணி அடிக்கவும்", "ACTIVE"),
        new Customer("cust_3", "விஜயலட்சுமி அம்மாள் (Vijayalakshmi)", "5", "அம்மன் கோவில் தெரு", "9443334567", 0.5, 0.5, 56.0, 3, "பூனை வராதபடி மூடி வைக்கவும்", "ACTIVE"),
        new Customer("cust_4", "சரவணன் மெடிக்கல்ஸ் (Saravanan)", "42", "மெயின் ரோடு", "9944445678", 2.0, 1.0, 54.0, 4, "கடை வாசலில் வைக்கவும்", "ACTIVE"),
        new Customer("cust_5", "கார்த்திக் இன்ஜினியர் (Karthik)", "108", "நேரு நகர்", "9841556789", 1.0, 0.0, 56.0, 5, "கூகுள் பே மூலம் பணம் செலுத்துவார்", "ACTIVE")
    );

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // CORS & Health check
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/customers", new CustomersHandler());
        server.createContext("/api/route/demand", new RouteDemandHandler());
        server.createContext("/api/billing/demo", new DemoBillingHandler());
        server.createContext("/api/extra-requests", new ExtraRequestsHandler());

        server.setExecutor(null);
        System.out.println("==================================================");
        System.out.println("🥛 PaalVandi Java 21 Enterprise Service Started!");
        System.out.println("🚀 Listening on: http://localhost:" + PORT);
        System.out.println("⚡ Ready to serve Route Optimization & Billing Calculations");
        System.out.println("==================================================");
        server.start();
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String json = """
                {
                    "status": "UP",
                    "system": "PaalVandi Farm Milk Management Engine",
                    "runtime": "Java 21 LTS",
                    "timestamp": "%s"
                }
                """.formatted(java.time.Instant.now());
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class CustomersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            List<Customer> optimized = routeService.optimizeDeliverySequence(SAMPLE_CUSTOMERS);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < optimized.size(); i++) {
                Customer c = optimized.get(i);
                sb.append(String.format(
                    "{\"id\":\"%s\",\"name\":\"%s\",\"houseNo\":\"%s\",\"street\":\"%s\",\"phone\":\"%s\",\"morningQty\":%.1f,\"eveningQty\":%.1f,\"rate\":%.0f,\"routeOrder\":%d}",
                    c.id(), c.name(), c.houseNo(), c.street(), c.phone(), c.defaultMorningQty(), c.defaultEveningQty(), c.ratePerLitre(), c.routeOrder()
                ));
                if (i < optimized.size() - 1) sb.append(",");
            }
            sb.append("]");
            sendJsonResponse(exchange, 200, sb.toString());
        }
    }

    static class RouteDemandHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            var morningDemand = routeService.calculateShiftDemand(SAMPLE_CUSTOMERS, "MORNING");
            var eveningDemand = routeService.calculateShiftDemand(SAMPLE_CUSTOMERS, "EVENING");

            String json = String.format(
                """
                {
                    "morning": { "totalLitres": %.1f, "activeHouses": %.0f, "cansNeeded": %.0f },
                    "evening": { "totalLitres": %.1f, "activeHouses": %.0f, "cansNeeded": %.0f }
                }
                """,
                morningDemand.get("totalLitres"), morningDemand.get("activeHouses"), morningDemand.get("20LitreCansNeeded"),
                eveningDemand.get("totalLitres"), eveningDemand.get("activeHouses"), eveningDemand.get("20LitreCansNeeded")
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class DemoBillingHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Customer cust = SAMPLE_CUSTOMERS.get(0);
            MonthlyBill bill = billingService.calculateMonthlyBill("2026-10", cust, Collections.emptyList(), 0);
            String whatsappText = invoiceService.generateWhatsAppTamil(bill, "ஸ்ரீ காமதேனு பால் பண்ணை", "dairyfarm@okaxis");
            String upiUrl = invoiceService.generateUpiDeepLink("dairyfarm@okaxis", "Sri Kamadhenu Dairy", bill.balanceDue(), "Milk Bill");

            String json = String.format(
                """
                {
                    "customerId": "%s",
                    "customerName": "%s",
                    "totalLitres": %.1f,
                    "deliveredDays": %d,
                    "totalAmount": %d,
                    "balanceDue": %d,
                    "upiUrl": "%s"
                }
                """,
                cust.id(), cust.name(), bill.totalLitres(), bill.deliveredDays(), bill.totalAmount(), bill.balanceDue(), upiUrl
            );
            sendJsonResponse(exchange, 200, json);
        }
    }
    static class ExtraRequestsHandler implements HttpHandler {
        private static final java.util.List<String> requests = new java.util.concurrent.CopyOnWriteArrayList<>();

        static {
            requests.add("{\"id\":\"req_demo_1\",\"customerId\":\"cust_1\",\"customerName\":\"முத்துசாமி (Muthusamy)\",\"houseNo\":\"14/A\",\"phone\":\"9840112345\",\"date\":\"2026-10-23\",\"shift\":\"MORNING\",\"extraLitres\":1.0,\"reason\":\"விருந்தினர் வருகை\",\"status\":\"PENDING\",\"createdAt\":\"2026-10-22T05:00:00Z\"}");
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("GET".equalsIgnoreCase(method)) {
                String json = "[" + String.join(",", requests) + "]";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                requests.add(0, body);
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Extra request updated on Java server\"}");
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }
}
