import apiClient from "./apiClient";

export function createCompanyDealer(dealerData) {
    return apiClient.post("/company/dealers", dealerData);
}

export function getCompanyDealer(dealerId) {
    return apiClient.get(`/company/dealers/${dealerId}`);
}

export function updateCompanyDealer(dealerId, dealerData) {
    return apiClient.put(`/company/dealers/${dealerId}`, dealerData);
}

export function withdrawCompanyDealer(dealerId) {
    return apiClient.delete(`/company/dealers/${dealerId}`);
}