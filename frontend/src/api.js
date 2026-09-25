import axios from "axios";
export const API="http://localhost:8000/api";
export const api=axios.create({baseURL:API});
export const ws=()=>new WebSocket("ws://localhost:8000/ws/telemetry");
