package com.milkdelivery.service;

import com.milkdelivery.model.MonthlyBill;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Service to format invoices for WhatsApp transmission and UPI deep-linking.
 */
public class InvoiceFormatterService {

    public String generateWhatsAppTamil(MonthlyBill bill, String dairyName, String upiId) {
        return String.format(
            """
            வணக்கம் *%s* அவர்களுக்கு,
            *%s* - மாதாந்திர பால் கணக்கு (%s):
            --------------------------------
            🥛 விநியோகம் செய்த நாட்கள்: %d நாட்கள்
            ⏸️ விடுப்பு நாட்கள்: %d நாட்கள்
            🍶 மொத்த பால் அளவு: *%.1f லிட்டர்*
            🏷️ லிட்டர் விலை: ₹%.0f
            💰 மொத்த கட்டணம்: *₹%d*
            ✅ செலுத்தியது: ₹%d
            ⚠️ *பாக்கி தொகை: ₹%d*
            --------------------------------
            UPI மூலம் செலுத்த: *%s* (Google Pay / PhonePe / Paytm)
            நன்றி! வாழ்க வளமுடன்!
            """,
            bill.customer().name(),
            dairyName,
            bill.month(),
            bill.deliveredDays(),
            bill.skippedDays(),
            bill.totalLitres(),
            bill.ratePerLitre(),
            bill.totalAmount(),
            bill.paidAmount(),
            bill.balanceDue(),
            upiId
        ).trim();
    }

    public String generateUpiDeepLink(String upiId, String payeeName, long amount, String note) {
        try {
            String encodedPayee = URLEncoder.encode(payeeName, StandardCharsets.UTF_8);
            String encodedNote = URLEncoder.encode(note, StandardCharsets.UTF_8);
            return String.format(
                "upi://pay?pa=%s&pn=%s&am=%d&cu=INR&tn=%s",
                upiId, encodedPayee, amount, encodedNote
            );
        } catch (Exception e) {
            return String.format("upi://pay?pa=%s&am=%d&cu=INR", upiId, amount);
        }
    }
}
