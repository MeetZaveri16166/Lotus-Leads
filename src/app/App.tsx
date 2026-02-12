import React, { useState } from "react";
import { DashboardPage } from "@/app/pages/DashboardPage";
import BusinessProfilePage from "@/app/pages/BusinessProfilePage";
import IcpPage from "@/app/pages/IcpPage";
import SavedSearchesPage from "@/app/pages/SavedSearchesPage";
import { LeadsPage } from "@/app/pages/LeadsPage-new";
import LeadDetailPage from "@/app/pages/LeadDetailPage";
import { CampaignsListPage } from "@/app/pages/CampaignsListPage";
import { CampaignBuilderWizard } from "@/app/pages/CampaignBuilderWizard";
import { MessageReviewPage } from "@/app/pages/MessageReviewPage";
import { CampaignDashboardPage } from "@/app/pages/CampaignDashboardPage";
import SettingsPage from "@/app/pages/SettingsPage";
import MigrationSQLPage from "@/app/pages/MigrationSQLPage";
import AdminPage from "@/app/pages/AdminPage";
import { KnowHowPage } from "@/app/pages/KnowHowPage";
import { LandingPage } from "@/app/marketing/LandingPage";
import { FeaturesPage } from "@/app/marketing/FeaturesPage";
import { PricingPage } from "@/app/marketing/PricingPage";
import { BackendStatus } from "@/app/components/BackendStatus";
import { OrganizationPage } from "@/app/pages/OrganizationPage";

type Screen =
  | "dashboard"
  | "business-profile"
  | "icp"
  | "saved-searches"
  | "leads"
  | "lead-detail"
  | "campaigns"
  | "campaign-builder"
  | "message-review"
  | "campaign-dashboard"
  | "settings"
  | "migration-sql"
  | "admin"
  | "know-how"
  | "organization"
  | "landing"
  | "features"
  | "pricing";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [campaignId, setCampaignId] = useState<string>("");
  const [icpData, setIcpData] = useState<any>(null);
  const [leadId, setLeadId] = useState<string>("");
  const [savedSearch, setSavedSearch] = useState<any>(null);
  const [leadsTab, setLeadsTab] = useState<"discovered" | "enriched">("discovered");

  const handleNav = (key: string, data?: any) => {
    if (key === "lead-detail" && data?.leadId) {
      setLeadId(data.leadId);
      // Remember which tab we're coming from
      if (data?.fromTab) {
        setLeadsTab(data.fromTab);
      }
      setScreen("lead-detail");
    } else if (key === "leads" && data?.tab) {
      // Support navigating to leads with a specific tab
      setLeadsTab(data.tab);
      setScreen("leads");
    } else if (key === "campaign-builder" && data?.campaignId) {
      setCampaignId(data.campaignId);
      setScreen("campaign-builder");
    } else if (key === "message-review" && data?.campaignId) {
      setCampaignId(data.campaignId);
      setScreen("message-review");
    } else if (key === "campaign-dashboard" && data?.campaignId) {
      setCampaignId(data.campaignId);
      setScreen("campaign-dashboard");
    } else if (key === "icp" && data?.savedSearch) {
      setSavedSearch(data.savedSearch);
      setScreen("icp");
    } else {
      // Clear savedSearch when navigating to icp without data
      if (key === "icp") {
        setSavedSearch(null);
      }
      setScreen(key as Screen);
    }
  };

  return (
    <>
      {screen === "dashboard" && <DashboardPage onNav={handleNav} />}
      {screen === "business-profile" && (
        <BusinessProfilePage onNav={handleNav} />
      )}
      {screen === "icp" && (
        <IcpPage
          onNav={handleNav}
          savedSearch={savedSearch}
        />
      )}
      {screen === "saved-searches" && (
        <SavedSearchesPage onNav={handleNav} icpData={icpData} />
      )}
      {screen === "leads" && (
        <LeadsPage
          onGoCampaigns={() => setScreen("campaigns")}
          onNav={handleNav}
          tab={leadsTab}
        />
      )}
      {screen === "lead-detail" && (
        <LeadDetailPage
          leadId={leadId}
          onBack={() => setScreen("leads")}
          onNav={handleNav}
        />
      )}
      {screen === "campaigns" && (
        <CampaignsListPage 
          onNav={handleNav}
          onCreateNew={() => {
            // Navigate to campaign builder with a new campaign
            setCampaignId(""); // Clear campaignId for new campaign
            setScreen("campaign-builder");
          }}
          onSelectCampaign={(id: string) => {
            // Navigate to campaign dashboard
            setCampaignId(id);
            setScreen("campaign-dashboard");
          }}
        />
      )}
      {screen === "campaign-builder" && (
        <CampaignBuilderWizard
          campaignId={campaignId}
          onNav={handleNav}
          onComplete={(id: string) => {
            setCampaignId(id);
            setScreen("campaign-dashboard");
          }}
        />
      )}
      {screen === "message-review" && (
        <MessageReviewPage
          campaignId={campaignId}
          onNav={handleNav}
        />
      )}
      {screen === "campaign-dashboard" && (
        <CampaignDashboardPage
          campaignId={campaignId}
          onNav={handleNav}
        />
      )}
      {screen === "settings" && <SettingsPage onNav={handleNav} />}
      {screen === "migration-sql" && <MigrationSQLPage onNav={handleNav} />}
      {screen === "organization" && <OrganizationPage onNav={handleNav} />}
      {screen === "admin" && <AdminPage onNav={handleNav} />}
      {screen === "know-how" && <KnowHowPage onNav={handleNav} />}
      {screen === "landing" && <LandingPage onNav={handleNav} />}
      {screen === "features" && <FeaturesPage onNav={handleNav} />}
      {screen === "pricing" && <PricingPage onNav={handleNav} />}
      <BackendStatus />
    </>
  );
}