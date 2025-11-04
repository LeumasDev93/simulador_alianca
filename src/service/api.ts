
import axios, { AxiosInstance } from 'axios';
import { getSession, signIn, useSession } from "next-auth/react";

const session = await getSession();
const token = session?.user?.accessToken;

const apiClient = axios.create({
  baseURL: '/api/anywhere/api/v1/private/externalsystem',
});

export { apiClient };