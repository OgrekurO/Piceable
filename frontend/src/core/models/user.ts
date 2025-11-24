/**
 * 用户信息接口
 */
export interface User {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
  roleId: number;
}