import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function ComponentsDemo() {
    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">MaxAI UI Components Demo</h1>
                <ThemeToggle />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                    <CardDescription>Metronic-themed button variants</CardDescription>
                </CardHeader>
                <CardContent className="space-x-4">
                    <Button variant="default">Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>Input, select, and form controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tabs & Progress</CardTitle>
                    <CardDescription>Navigation and progress indicators</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Progress</span>
                                    <span>75%</span>
                                </div>
                                <Progress value={75} />
                            </div>
                        </TabsContent>
                        <TabsContent value="analytics">
                            <p>Analytics content would go here.</p>
                        </TabsContent>
                        <TabsContent value="settings">
                            <p>Settings content would go here.</p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Alerts & Badges</CardTitle>
                    <CardDescription>Status indicators and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>
                            Your changes have been saved successfully.
                        </AlertDescription>
                    </Alert>
                    <div className="space-x-2">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}