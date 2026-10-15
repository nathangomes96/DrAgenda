import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import AppSidebar from "./_components/app-sidebar";
import { TrialBanner } from "./_components/trial-banner";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full flex flex-col min-h-screen">
          <TrialBanner />
          <div className="flex-1 w-full">
            <SidebarTrigger />
            {children}
          </div>
        </main>
      </SidebarProvider>
    </>
  );
};
export default ProtectedLayout;
