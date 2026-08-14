package com.healthcare.billing.model;

import java.time.LocalDateTime;

public class Bill {

    private Long id;
    private Long appointmentId;
    private String patientName;
    private String doctorName;
    private Double consultationFee;
    private Double taxAmount;
    private Double totalAmount;
    private String paymentStatus; // PAID, PENDING, CANCELLED
    private String invoiceDate;

    public Bill() {
    }

    public Bill(Long id, Long appointmentId, String patientName, String doctorName, Double consultationFee, String paymentStatus) {
        this.id = id;
        this.appointmentId = appointmentId;
        this.patientName = patientName;
        this.doctorName = doctorName;
        this.consultationFee = consultationFee != null ? consultationFee : 50.0;
        this.taxAmount = Math.round((this.consultationFee * 0.05) * 100.0) / 100.0; // 5% standard tax
        this.totalAmount = this.consultationFee + this.taxAmount;
        this.paymentStatus = paymentStatus != null ? paymentStatus : "PAID";
        this.invoiceDate = LocalDateTime.now().toLocalDate().toString();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public Double getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(Double consultationFee) {
        this.consultationFee = consultationFee;
    }

    public Double getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(Double taxAmount) {
        this.taxAmount = taxAmount;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(String invoiceDate) {
        this.invoiceDate = invoiceDate;
    }
}
