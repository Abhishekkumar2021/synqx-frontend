import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ModeToggle } from '../../components/ModeToggle';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
            <p className="text-muted-foreground">Manage your workspace preferences.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the console.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Theme</span>
                    <ModeToggle />
                </div>
            </CardContent>
        </Card>

        {/* Profile (Placeholder) */}
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Display Name</label>
                    <Input defaultValue="Abhishek" />
                </div>
                 <div className="grid gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue="admin@synqx.dev" disabled />
                </div>
                <Button>Save Changes</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
