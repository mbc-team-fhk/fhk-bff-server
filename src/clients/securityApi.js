import axios from "axios";
import { CORE_SERVICES } from "../config/index.js";

export const securityApi = axios.create({
    baseURL: CORE_SERVICES.SECURITY,
    timeout: 5000,
});