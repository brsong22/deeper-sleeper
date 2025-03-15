import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const axiosClient = axios.create({
    baseURL: API_URL, // Set the default base URL
    timeout: 10000, // Optional: Set a timeout (10 seconds)
    headers: {
        'Content-Type': 'application/json'
    }
});

export default axiosClient;