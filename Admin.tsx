import AdminGuard from "@/components/AdminGuard";
import SiteLayout, { PageHeading } from "@/components/SiteLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationManager from "./ApplicationManager";
import CourseManager from "./CourseManager";
import UserManager from "./UserManager";

export default function Admin() {
  return (
    <SiteLayout>
      <AdminGuard>
        <PageHeading
          eyebrow="ADMIN · EDUCATION"
          title="교육관리"
          desc="새로 들어온 신청을 가장 먼저 확인하고, 승인·반려 처리와 교육 과정 관리를 할 수 있습니다."
        />
        <div className="container">
          <Tabs defaultValue="applications">
            <TabsList>
              <TabsTrigger value="courses">교육 과정</TabsTrigger>
              <TabsTrigger value="applications">신청 현황</TabsTrigger>
              <TabsTrigger value="users">관리자 지정</TabsTrigger>
            </TabsList>
            <TabsContent value="courses" className="mt-6">
              <CourseManager />
            </TabsContent>
            <TabsContent value="applications" className="mt-6">
              <ApplicationManager />
            </TabsContent>
            <TabsContent value="users" className="mt-6">
              <UserManager />
            </TabsContent>
          </Tabs>
        </div>
      </AdminGuard>
    </SiteLayout>
  );
}
