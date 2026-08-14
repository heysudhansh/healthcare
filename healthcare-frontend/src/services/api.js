import axios from "axios";

// 1. Main Backend API (Port 8081)
const api = axios.create({
    baseURL: "http://localhost:8081"
});

// 2. Notification Microservice (Port 8082)
export const notificationApi = axios.create({
    baseURL: "http://localhost:8082"
});

// 3. Billing Microservice (Port 8083)
export const billingApi = axios.create({
    baseURL: "http://localhost:8083"
});

export default api;