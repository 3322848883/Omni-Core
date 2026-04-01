export interface User {
  id: number;
  user_id: string;
  email: string;
  username: string;
  password_hash: string;
  vpn_uuid: string;
  status: string;
  traffic_limit: number;
  traffic_used: number;
  expire_date: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSubscription {
  id: number;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserTraffic {
  user_id: string;
  traffic_limit: number;
  traffic_used: number;
  reset_date: Date;
}
