import axios from "axios";
import { SECURITY_SERVER } from "../config.js";

export const securityApi = axios.create({
    baseURL: SECURITY_SERVER,
    timeout: 5000,
});