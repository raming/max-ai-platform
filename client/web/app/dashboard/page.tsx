'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StatsCard } from '@/components/dashboard/stats-card'
import { DataTable, Column } from '@/components/dashboard/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { ResponsiveGrid } from '@/components/ui/responsive-grid'
import { Activity, Users, CreditCard, TrendingUp } from 'lucide-react'
import { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
]

const columns: Column<User>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  {
    key: 'status',
    header: 'Status',
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'Active'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {value}
      </span>
    )
  }
]

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert('Form submitted!')
    }, 2000)
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the MaxAI Platform dashboard
            </p>
          </div>

          {/* Stats Cards */}
          <ResponsiveGrid columns={{ default: 1, md: 2, lg: 4 }} gap="md">
            <StatsCard
              title="Total Users"
              value="2,543"
              description="Active users this month"
              icon={Users}
              trend={{ value: 12.5, label: 'from last month' }}
            />
            <StatsCard
              title="API Calls"
              value="45,231"
              description="Requests this week"
              icon={Activity}
              trend={{ value: 8.2, label: 'from last week' }}
            />
            <StatsCard
              title="Revenue"
              value="$12,543"
              description="This month"
              icon={CreditCard}
              trend={{ value: -2.1, label: 'from last month' }}
            />
            <StatsCard
              title="Growth"
              value="23.5%"
              description="User growth rate"
              icon={TrendingUp}
              trend={{ value: 5.4, label: 'from last quarter' }}
            />
          </ResponsiveGrid>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Users Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>
                    A list of recent user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={mockUsers}
                    columns={columns}
                    pagination={{
                      page: 1,
                      pageSize: 10,
                      total: 25,
                      onPageChange: (page) => console.log('Page:', page)
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Form Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Add New User</CardTitle>
                  <CardDescription>
                    Create a new user account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoadingOverlay loading={loading}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter full name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Enter a message (optional)"
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        Create User
                      </Button>
                    </form>
                  </LoadingOverlay>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  )
}