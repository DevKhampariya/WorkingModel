"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Scatter,
} from "recharts"

interface FraudChartsProps {
  analytics: {
    dailyStats: Array<{
      date: string
      total: number
      suspicious: number
      fraudRate: number
    }>
    riskDistribution: Array<{
      risk: string
      count: number
      percentage: number
    }>
    transactionTypes: Array<{
      type: string
      total: number
      suspicious: number
    }>
  }
  transactions?: Array<{
    transactionId: string
    customerId: string
    type: string
    amount: number
    riskScore: number
    timestamp: string
    status: string
    reason: string
  }>
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"]

export function FraudCharts({ analytics, transactions = [] }: FraudChartsProps) {
  const calculateBoxPlotData = () => {
    if (!transactions.length) return []

    const amounts = transactions.map((t) => t.amount).sort((a, b) => a - b)
    const q1Index = Math.floor(amounts.length * 0.25)
    const q2Index = Math.floor(amounts.length * 0.5)
    const q3Index = Math.floor(amounts.length * 0.75)

    const q1 = amounts[q1Index]
    const median = amounts[q2Index]
    const q3 = amounts[q3Index]
    const min = amounts[0]
    const max = amounts[amounts.length - 1]
    const iqr = q3 - q1

    // Calculate outliers
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr
    const outliers = amounts.filter((a) => a < lowerFence || a > upperFence)

    return [
      {
        category: "Transaction Amounts",
        min,
        q1,
        median,
        q3,
        max,
        outliers: outliers.length,
        whiskerLow: Math.max(min, lowerFence),
        whiskerHigh: Math.min(max, upperFence),
      },
    ]
  }

  const boxPlotData = calculateBoxPlotData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Date: ${label ? new Date(label).toLocaleDateString() : "N/A"}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}${entry.name?.includes("Rate") ? "%" : ""}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Type: ${label || "N/A"}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Risk Level: ${data.risk || "N/A"}`}</p>
          <p>{`Count: ${data.count || 0}`}</p>
          <p>{`Percentage: ${data.percentage || 0}%`}</p>
        </div>
      )
    }
    return null
  }

  const BoxPlotTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">Transaction Amount Distribution</p>
          <p>{`Min: $${data.min?.toLocaleString() || 0}`}</p>
          <p>{`Q1: $${data.q1?.toLocaleString() || 0}`}</p>
          <p>{`Median: $${data.median?.toLocaleString() || 0}`}</p>
          <p>{`Q3: $${data.q3?.toLocaleString() || 0}`}</p>
          <p>{`Max: $${data.max?.toLocaleString() || 0}`}</p>
          <p>{`Outliers: ${data.outliers || 0}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Daily Fraud Trend - Enhanced with better styling */}
      <Card className="lg:col-span-2 shadow-sm border-l-4 border-l-red-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📈 Daily Fraud Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              fraudRate: {
                label: "Fraud Rate %",
                color: "#ef4444",
              },
              suspicious: {
                label: "Suspicious Count",
                color: "#f97316",
              },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyStats} margin={{ top: 25, right: 35, left: 25, bottom: 25 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  label={{ value: "Fraud Rate (%)", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  label={{ value: "Count", angle: 90, position: "insideRight" }}
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="fraudRate"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Fraud Rate %"
                  dot={{ r: 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#ef4444" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="suspicious"
                  stroke="#f97316"
                  strokeWidth={3}
                  name="Suspicious Count"
                  dot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#f97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Risk Distribution - Enhanced with better colors and layout */}
      <Card className="shadow-sm border-l-4 border-l-orange-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🎯 Risk Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              count: {
                label: "Count",
                color: "#ef4444",
              },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 25, right: 25, bottom: 25, left: 25 }}>
                <Pie
                  data={analytics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ risk, percentage }) => `${risk}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {analytics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Box Plot - Enhanced with better visualization */}
      <Card className="lg:col-span-2 shadow-sm border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📊 Transaction Amount Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              median: {
                label: "Median",
                color: "#3b82f6",
              },
              q1: {
                label: "Q1",
                color: "#06b6d4",
              },
              q3: {
                label: "Q3",
                color: "#8b5cf6",
              },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={boxPlotData} margin={{ top: 25, right: 35, left: 25, bottom: 25 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  label={{ value: "Amount ($)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<BoxPlotTooltip />} />

                {/* Enhanced box plot with better colors */}
                <Bar dataKey="q1" fill="#06b6d4" opacity={0.7} name="Q1" radius={[2, 2, 0, 0]} />
                <Bar dataKey="median" fill="#3b82f6" opacity={0.9} name="Median" radius={[2, 2, 0, 0]} />
                <Bar dataKey="q3" fill="#8b5cf6" opacity={0.7} name="Q3" radius={[2, 2, 0, 0]} />

                <Scatter dataKey="whiskerLow" fill="#ef4444" />
                <Scatter dataKey="whiskerHigh" fill="#ef4444" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Transaction Types - Enhanced with better styling */}
      <Card className="shadow-sm border-l-4 border-l-green-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            💳 Fraud by Transaction Type
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            config={{
              total: {
                label: "Total",
                color: "#22c55e",
              },
              suspicious: {
                label: "Suspicious",
                color: "#ef4444",
              },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.transactionTypes} margin={{ top: 25, right: 35, left: 25, bottom: 25 }}>
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                  tickLine={{ stroke: "#e5e7eb" }}
                  label={{ value: "Count", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<CustomBarTooltip />} />
                <Bar dataKey="total" fill="#22c55e" name="Total" radius={[4, 4, 0, 0]} opacity={0.8} />
                <Bar dataKey="suspicious" fill="#ef4444" name="Suspicious" radius={[4, 4, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
