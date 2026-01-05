import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FocusSession } from "@/lib/types";
import { format, subDays, isSameDay } from "date-fns";

interface FocusTrendsChartProps {
    sessions: FocusSession[];
}

export const FocusTrendsChart = ({ sessions }: FocusTrendsChartProps) => {
    // Generate last 7 days data
    const data = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const daySessions = sessions.filter(s => isSameDay(new Date(s.started_at), date));
        const minutes = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0);

        return {
            name: format(date, "EEE"), // Mon, Tue...
            minutes: minutes,
            shortDate: format(date, "MMM d")
        };
    });

    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Focus Trends</CardTitle>
                <CardDescription>
                    Your focus time over the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}m`}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] map-transform uppercase text-muted-foreground">
                                                        {label}
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {payload[0].value} mins
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Bar
                            dataKey="minutes"
                            fill="hsl(var(--primary))" // Use CSS variable for color
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
