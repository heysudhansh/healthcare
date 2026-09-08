package com.healthcare.notification.service;

import com.healthcare.notification.model.Notification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final Map<Long, Notification> notificationStore = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    public NotificationService() {
        // Sample initial notifications for demonstration
        sendNotification(new Notification(
                idGenerator.getAndIncrement(),
                "patient@hospital.com",
                "Rahul Sharma",
                "Appointment Confirmed",
                "Your consultation with Dr. Bhavna Chaudhry is confirmed for tomorrow at 10:00 AM.",
                "EMAIL"
        ));
        sendNotification(new Notification(
                idGenerator.getAndIncrement(),
                "dr.bhavna@hospital.com",
                "Dr. Bhavna Chaudhry",
                "New Patient Booking",
                "Patient Rahul Sharma has booked an appointment for tomorrow at 10:00 AM.",
                "EMAIL"
        ));
    }

    public Notification sendNotification(Notification notification) {
        if (notification.getId() == null) {
            notification.setId(idGenerator.getAndIncrement());
        }
        if (notification.getStatus() == null) {
            notification.setStatus("SENT");
        }
        if (notification.getTimestamp() == null) {
            notification.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (notification.getNotificationType() == null) {
            notification.setNotificationType("EMAIL");
        }

        notificationStore.put(notification.getId(), notification);
        System.out.println("🔔 [NOTIFICATION SENT] To: " + notification.getRecipientEmail() + " | Subject: " + notification.getSubject());
        return notification;
    }

    public List<Notification> getAllNotifications() {
        return new ArrayList<>(notificationStore.values());
    }

    public List<Notification> getNotificationsByRecipient(String email) {
        if (email == null) return Collections.emptyList();
        return notificationStore.values().stream()
                .filter(n -> email.equalsIgnoreCase(n.getRecipientEmail()))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getNotificationSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalDispatched", notificationStore.size());
        summary.put("status", "ACTIVE");
        summary.put("servicePort", 8082);
        return summary;
    }
}
