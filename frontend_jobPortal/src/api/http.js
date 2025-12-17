import axios from "axios";
const http = axios.create({ baseURL: "http://localhost:5000" });

export const attachToken = (token) => {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
};

export default http;
