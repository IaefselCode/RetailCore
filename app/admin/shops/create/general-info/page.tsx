'use client'

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button as AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  ChevronRight,
  Home,
  X,
} from "lucide-react"
import Link from "next/link"

export default function GeneralInfoPage() {
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [shopType, setShopType] = useState("")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="size-3.5" />
        <Link href="/admin" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/admin/shops" className="hover:text-foreground">Shops</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Create Shop</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Create New Shop</CardTitle>
              <CardDescription>Step 1 of 2: General Information</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <Input
              id="shopName"
              placeholder="Enter shop name"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter street address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shopType">Shop Type</Label>
            <Select value={shopType} onValueChange={(v) => setShopType(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select shop type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
                <SelectItem value="Outlet">Outlet</SelectItem>
                <SelectItem value="Pop-up">Pop-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <AnimatedButton variant="outline" asChild>
            <Link href="/admin/shops">
              <X /> Cancel
            </Link>
          </AnimatedButton>
          <AnimatedButton asChild>
            <Link href="/admin/shops/create/manager-assignment">
              Next Step <ChevronRight />
            </Link>
          </AnimatedButton>
        </CardFooter>
      </Card>
    </div>
  )
}
