import Slider from "@/components/home/Slider";
import IconButtons from "@/components/home/IconButtons";
import MiningSection from "@/components/home/MiningSection";
import IncomeCalculator from "@/components/home/IncomeCalculator";
import MiningStats from "@/components/home/MiningStats";
import UsageProcess from "@/components/home/UsageProcess";
import ProjectFeatures from "@/components/home/ProjectFeatures";
import UserBenefits from "@/components/home/UserBenefits";
import AdminUsersPage from "@/components/admin/AdminUsersPage";
import { isAdmin } from "@/constents";

export default function Home() {
  return (
    <>
      {isAdmin ? (
        <AdminUsersPage />
      ) : (
        <div className="p-3 space-y-3">
          {/* Slider */}
          <Slider />

          {/* Icon Buttons */}
          <IconButtons />

          {/* Mining Section */}
          <MiningSection />

          <UserBenefits />

          {/* Income Calculator */}
          <IncomeCalculator />

          {/* Mining Stats */}
          <MiningStats />

          {/* Usage Process */}
          <UsageProcess />

          {/* Project Features */}
          <ProjectFeatures />

          {/* User Benefits */}
        </div>
      )}
    </>
  );
}
