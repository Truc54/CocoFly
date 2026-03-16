import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import LiveAuctionsSection from "@/components/home/LiveAuctionsSection";
import LeaderboardSection from "@/components/home/LeaderboardSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <LiveAuctionsSection />
      <CategoriesSection />
      <LeaderboardSection />
    </>
  );
}
