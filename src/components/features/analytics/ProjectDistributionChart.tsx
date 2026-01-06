import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FocusSession, Project } from "@/lib/types";

interface ProjectDistributionChartProps {
    sessions: FocusSession[];
    projects: Project[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ProjectDistributionChart = ({ sessions, projects }: ProjectDistributionChartProps) => {
    // Aggregate minutes per project
    const projectTime: Record<string, number> = {};

    sessions.forEach(session => {
        if (session.project_id) {
            projectTime[session.project_id] = (projectTime[session.project_id] || 0) + session.duration_minutes;
        } else {
            projectTime['unassigned'] = (projectTime['unassigned'] || 0) + session.duration_minutes;
        }
    });

    const data = Object.keys(projectTime).map(projectId => {
        const project = projects.find(p => p.id === projectId);
        return {
            name: project ? project.name : (projectId === 'unassigned' ? 'Unassigned' : 'Unknown'),
            value: projectTime[projectId]
        };
    }).filter(d => d.value > 0);

    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>
                    Time spent across your projects.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} mins`, 'Duration']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
