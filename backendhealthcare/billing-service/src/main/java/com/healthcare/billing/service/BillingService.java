package com.healthcare.billing.service;

import com.healthcare.billing.model.Bill;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class BillingService {

    private final Map<Long, Bill> billDatabase = new ConcurrentHashMap<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    public BillingService() {
        // Initial sample seed bills with Indian doctor names and INR fees
        createBill(new Bill(idCounter.getAndIncrement(), 101L, "Rahul Sharma", "Dr. Bhavna Chaudhry", 1200.0, "PAID"));
        createBill(new Bill(idCounter.getAndIncrement(), 102L, "Amit Verma", "Dr. Rajiv Dang", 1000.0, "PAID"));
        createBill(new Bill(idCounter.getAndIncrement(), 103L, "Pooja Patel", "Dr. Arvind M Das", 1500.0, "PAID"));
    }

    public Bill createBill(Bill bill) {
        if (bill.getId() == null) {
            bill.setId(idCounter.getAndIncrement());
        }
        if (bill.getConsultationFee() == null) {
            bill.setConsultationFee(1000.0);
        }
        if (bill.getTaxAmount() == null) {
            bill.setTaxAmount(Math.round((bill.getConsultationFee() * 0.05) * 100.0) / 100.0);
        }
        if (bill.getTotalAmount() == null) {
            bill.setTotalAmount(bill.getConsultationFee() + bill.getTaxAmount());
        }
        if (bill.getPaymentStatus() == null) {
            bill.setPaymentStatus("PAID");
        }
        if (bill.getInvoiceDate() == null) {
            bill.setInvoiceDate(java.time.LocalDate.now().toString());
        }

        billDatabase.put(bill.getId(), bill);
        return bill;
    }

    public List<Bill> getAllBills() {
        return new ArrayList<>(billDatabase.values());
    }

    public Optional<Bill> getBillById(Long id) {
        return Optional.ofNullable(billDatabase.get(id));
    }

    public Optional<Bill> getBillByAppointmentId(Long appointmentId) {
        return billDatabase.values().stream()
                .filter(b -> Objects.equals(b.getAppointmentId(), appointmentId))
                .findFirst();
    }

    public Map<String, Object> getRevenueSummary() {
        double totalRevenue = billDatabase.values().stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getPaymentStatus()))
                .mapToDouble(Bill::getTotalAmount)
                .sum();

        long paidBills = billDatabase.values().stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getPaymentStatus()))
                .count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        summary.put("totalInvoices", billDatabase.size());
        summary.put("paidInvoices", paidBills);
        summary.put("currency", "INR (₹)");
        return summary;
    }
}
