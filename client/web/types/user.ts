export interface User {
  id: string
  email: string
  tenantId: string
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface UserProfile extends User {
  firstName?: string
  lastName?: string
  avatar?: string
}