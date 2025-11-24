/**
 * 用户信息接口
 */
export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  roleId: number;
  // 可以把 Role 组合进来
  role?: Role;
}