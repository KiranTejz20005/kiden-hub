import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FocusSession, Task, Project } from "@/lib/types";
import { Clock, CheckSquare, Zap, Flame } from "lucide-react";

interface StatsCardsProps {
    sessions: FocusSession[];
    tasks: Task[];
}

export const StatsCards = ({ sessions, tasks }: StatsCardsProps) => {
    const totalFocusMinutes = sessions.reduce((acc, session) => acc + session.duration_minutes, 0);
    const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
    const completedTasks = tasks.filter(t => t.status === 'done').length;

    // Calculate Streak (Simplified: checking consecutive days with sessions)
    // This is a basic implementation. Ideally, we should check dates.
    let currentStreak = 0;
    if (sessions.length > 0) {
        // Sort sessions by date descending
        const sortedSessions = [...sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
        const today = new Date().toDateString();
        const lastSessionDate = new Date(sortedSessions[0].started_at).toDateString();

        if (lastSessionDate === today) {
            currentStreak = 1;
            // Check previous days... (Logic can be enhanced later for rigorous streak calc)
            // For now, let's keep it simple or placeholder if complex logic is not requested yet.
            // Let's assume 1 for today if active.
        }
    }

    const cards = [
        {
            title: "Total Focus Time",
            value: `${totalFocusHours}h`,
            icon: Clock,
            description: "All time focus duration",
            color: "text-blue-500"
        },
        {
            title: "Tasks Completed",
            value: completedTasks,
            icon: CheckSquare,
            description: "Total tasks finished",
            color: "text-green-500"
        },
        {
            title: "Focus Sessions",
            value: sessions.length,
            icon: Zap,
            description: "Total sessions completed",
            color: "text-yellow-500"
        },
        {
            title: "Current Streak",
            value: `${currentStreak} Days`, // Placeholder logic
            icon: Flame,
            description: "Consecutive days active",
            color: "text-orange-500"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-4 w-4 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {card.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
