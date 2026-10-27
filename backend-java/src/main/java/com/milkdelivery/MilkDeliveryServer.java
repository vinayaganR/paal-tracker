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

    private static final java.util.List<Customer> CUSTOMER_LIST = new java.util.concurrent.CopyOnWriteArrayList<>(SAMPLE_CUSTOMERS);

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // CORS & Health check
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/customers", new CustomersHandler());
        server.createContext("/api/route/demand", new RouteDemandHandler());
        server.createContext("/api/billing/demo", new DemoBillingHandler());
        server.createContext("/api/extra-requests", new ExtraRequestsHandler());
        server.createContext("/api/leave-requests", new LeaveRequestsHandler());
        server.createContext("/api/deliveries", new DeliveriesHandler());
        server.createContext("/api/device-tokens", new DeviceTokensHandler());
        server.createContext("/api/send-notification", new SendNotificationHandler());

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
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String extractJsonField(String json, String field) {
        if (json == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"");
        java.util.regex.Matcher m = p.matcher(json);
        if (m.find()) return m.group(1);
        return null;
    }

    private static double extractDoubleField(String json, String field, double defVal) {
        if (json == null) return defVal;
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"" + field + "\"\\s*:\\s*([0-9.]+)");
        java.util.regex.Matcher m = p.matcher(json);
        if (m.find()) {
            try { return Double.parseDouble(m.group(1)); } catch (Exception e) {}
        }
        return defVal;
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
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                try {
                    String id = extractJsonField(body, "id");
                    if (id == null || id.isEmpty()) id = "cust_" + System.currentTimeMillis();
                    String name = extractJsonField(body, "name");
                    String houseNo = extractJsonField(body, "houseNo");
                    String street = extractJsonField(body, "street");
                    String phone = extractJsonField(body, "phone");
                    double morning = extractDoubleField(body, "defaultMorningQty", 1.0);
                    double evening = extractDoubleField(body, "defaultEveningQty", 0.0);
                    double rate = extractDoubleField(body, "ratePerLitre", 56.0);
                    int order = CUSTOMER_LIST.size() + 1;
                    String notes = extractJsonField(body, "notes");

                    Customer newCust = new Customer(
                        id, 
                        name != null ? name : "புதிய வாடிக்கையாளர்", 
                        houseNo != null ? houseNo : "—", 
                        street != null ? street : "", 
                        phone != null ? phone : "", 
                        morning, 
                        evening, 
                        rate, 
                        order, 
                        notes != null ? notes : "", 
                        "ACTIVE"
                    );

                    int existingIdx = -1;
                    for (int i = 0; i < CUSTOMER_LIST.size(); i++) {
                        Customer c = CUSTOMER_LIST.get(i);
                        if (c.id().equals(id) || (phone != null && !phone.isEmpty() && c.phone().replaceAll("[^0-9]", "").equals(phone.replaceAll("[^0-9]", "")))) {
                            existingIdx = i;
                            break;
                        }
                    }
                    if (existingIdx >= 0) {
                        CUSTOMER_LIST.set(existingIdx, newCust);
                    } else {
                        CUSTOMER_LIST.add(newCust);
                    }
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Customer saved\",\"data\":{\"id\":\"" + id + "\"}}");
                    return;
                } catch (Exception e) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"" + e.getMessage() + "\"}");
                    return;
                }
            }
            if ("GET".equalsIgnoreCase(method)) {
                List<Customer> list = new ArrayList<>(CUSTOMER_LIST);
                StringBuilder sb = new StringBuilder("{\"success\":true,\"count\":" + list.size() + ",\"data\":[");
                for (int i = 0; i < list.size(); i++) {
                    Customer c = list.get(i);
                    sb.append(String.format(
                        "{\"id\":\"%s\",\"name\":\"%s\",\"houseNo\":\"%s\",\"street\":\"%s\",\"phone\":\"%s\",\"defaultMorningQty\":%.1f,\"defaultEveningQty\":%.1f,\"ratePerLitre\":%.0f,\"routeOrder\":%d,\"status\":\"%s\"}",
                        c.id(), c.name(), c.houseNo(), c.street(), c.phone(), c.defaultMorningQty(), c.defaultEveningQty(), c.ratePerLitre(), c.routeOrder(), c.status()
                    ));
                    if (i < list.size() - 1) sb.append(",");
                }
                sb.append("]}");
                sendJsonResponse(exchange, 200, sb.toString());
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
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
                String json = "{\"success\":true,\"count\":" + requests.size() + ",\"data\":[" + String.join(",", requests) + "]}";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                requests.add(0, body);
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Extra request recorded\"}");
                return;
            }
            if ("PUT".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                String reqId = extractJsonField(body, "requestId");
                String status = extractJsonField(body, "status");
                if (reqId != null && status != null) {
                    for (int i = 0; i < requests.size(); i++) {
                        String r = requests.get(i);
                        if (r.contains("\"id\":\"" + reqId + "\"") || r.contains("\"id\": \"" + reqId + "\"")) {
                            String updated = r.replaceAll("\"status\"\\s*:\\s*\"[^\"]*\"", "\"status\":\"" + status + "\"");
                            requests.set(i, updated);
                            break;
                        }
                    }
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Extra request status updated\"}");
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class LeaveRequestsHandler implements HttpHandler {
        private static final java.util.List<String> leaveRequests = new java.util.concurrent.CopyOnWriteArrayList<>();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("GET".equalsIgnoreCase(method)) {
                String json = "{\"success\":true,\"count\":" + leaveRequests.size() + ",\"data\":[" + String.join(",", leaveRequests) + "]}";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                leaveRequests.add(0, body);
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Leave request recorded\"}");
                return;
            }
            if ("PUT".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                String reqId = extractJsonField(body, "requestId");
                String status = extractJsonField(body, "status");
                if (reqId != null && status != null) {
                    for (int i = 0; i < leaveRequests.size(); i++) {
                        String r = leaveRequests.get(i);
                        if (r.contains("\"id\":\"" + reqId + "\"") || r.contains("\"id\": \"" + reqId + "\"")) {
                            String updated = r.replaceAll("\"status\"\\s*:\\s*\"[^\"]*\"", "\"status\":\"" + status + "\"");
                            leaveRequests.set(i, updated);
                            break;
                        }
                    }
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Leave request status updated\"}");
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class DeviceTokensHandler implements HttpHandler {
        private static final java.util.List<String> tokens = new java.util.concurrent.CopyOnWriteArrayList<>();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("GET".equalsIgnoreCase(method)) {
                String json = "{\"success\":true,\"data\":[" + String.join(",", tokens) + "]}";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                tokens.add(body);
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Device token registered\"}");
                return;
            }
            sendJsonResponse(exchange, 200, "{\"success\":true}");
        }
    }

    static class SendNotificationHandler implements HttpHandler {
        private static final java.util.List<String> notifications = new java.util.concurrent.CopyOnWriteArrayList<>();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("GET".equalsIgnoreCase(method)) {
                String json = "{\"success\":true,\"data\":[" + String.join(",", notifications) + "]}";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                notifications.add(0, body);
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Notification sent\"}");
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class DeliveriesHandler implements HttpHandler {
        private static final java.util.List<String> deliveries = new java.util.concurrent.CopyOnWriteArrayList<>();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            if ("OPTIONS".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 200, "{}");
                return;
            }
            if ("GET".equalsIgnoreCase(method)) {
                String query = exchange.getRequestURI().getQuery();
                java.util.List<String> filtered = new java.util.ArrayList<>();
                for (String d : deliveries) {
                    boolean match = true;
                    if (query != null) {
                        for (String param : query.split("&")) {
                            String[] kv = param.split("=");
                            if (kv.length == 2) {
                                String key = kv[0];
                                String val = kv[1];
                                if ("date".equals(key) && !d.contains("\"date\":\"" + val + "\"")) match = false;
                                if ("shift".equals(key) && !d.contains("\"shift\":\"" + val + "\"")) match = false;
                                if ("customerId".equals(key) && !d.contains("\"customerId\":\"" + val + "\"")) match = false;
                                if ("month".equals(key) && !d.contains("\"date\":\"" + val)) match = false;
                            }
                        }
                    }
                    if (match) filtered.add(d);
                }
                String json = "{\"success\":true,\"count\":" + filtered.size() + ",\"data\":[" + String.join(",", filtered) + "]}";
                sendJsonResponse(exchange, 200, json);
                return;
            }
            if ("POST".equalsIgnoreCase(method)) {
                byte[] bytes = exchange.getRequestBody().readAllBytes();
                String body = new String(bytes, StandardCharsets.UTF_8);
                String date = extractJsonField(body, "date");
                String shift = extractJsonField(body, "shift");
                String customerId = extractJsonField(body, "customerId");

                if (date != null && shift != null && customerId != null) {
                    int existingIdx = -1;
                    for (int i = 0; i < deliveries.size(); i++) {
                        String d = deliveries.get(i);
                        if (d.contains("\"date\":\"" + date + "\"") &&
                            d.contains("\"shift\":\"" + shift + "\"") &&
                            d.contains("\"customerId\":\"" + customerId + "\"")) {
                            existingIdx = i;
                            break;
                        }
                    }
                    if (existingIdx >= 0) {
                        deliveries.set(existingIdx, body);
                    } else {
                        deliveries.add(body);
                    }
                } else {
                    deliveries.add(body);
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Delivery recorded\"}");
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }
}
