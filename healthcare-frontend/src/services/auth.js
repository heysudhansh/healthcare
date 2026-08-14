const USER_KEY = "healthcare_user";

export const getCurrentUser = () => {
    try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

export const setCurrentUser = (user) => {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
};

export const logout = () => {
    localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
    return getCurrentUser() !== null;
};
