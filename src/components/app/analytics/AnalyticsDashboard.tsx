import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { StatsCards } from "./StatsCards";
import { FocusTrendsChart } from "./FocusTrendsChart";
import { ProjectDistributionChart } from "./ProjectDistributionChart";
import { Loader2 } from "lucide-react";
import { PageLayout } from "@/components/ui/PageLayout";
import { PageHeader } from "@/components/ui/PageHeader";

export const AnalyticsDashboard = () => {
    const { sessions, loading: sessionsLoading } = useFocusSessions();
    const { tasks, loading: tasksLoading } = useTasks();
    const { projects, loading: projectsLoading } = useProjects();

    const loading = sessionsLoading || tasksLoading || projectsLoading;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <PageLayout>
            <PageHeader title="Analytics" description="Track your focus and productivity trends." />

            <div className="space-y-8">
                <StatsCards sessions={sessions} tasks={tasks} />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <FocusTrendsChart sessions={sessions} />
                    <ProjectDistributionChart sessions={sessions} projects={projects} />
                </div>
            </div>
        </PageLayout>
    );
};
