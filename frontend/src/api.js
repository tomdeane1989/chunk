// frontend/src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5002/api", // Set your base URL here
});

export default api;