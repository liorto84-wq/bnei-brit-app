"use client";

import { useTranslations } from "next-intl";
import { useCompliance } from "@/contexts/compliance-context";
import PensionTracker from "./pension-tracker";
import NITracker from "./ni-tracker";
import PeaceOfMindView from "./peace-of-mind-view";

const TABS = ["pension", "ni", "peaceOfMind"] as const;
const TAB_KEYS: Record<(typeof TABS)[number], string> = {
  pension: "tabPension",
  ni: "tabNI",
  peaceOfMind: "tabPeaceOfMind",
};

export default function ComplianceSection() {
  const t = useTranslations("compliance");
  const { activeTab, setActiveTab } = useCompliance();

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-bold text-teal-900">
        {t("sectionTitle")}
      </h2>

      {/* Tab Bar */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t(TAB_KEYS[tab])}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {activeTab === "pension" && <PensionTracker />}
      {activeTab === "ni" && <NITracker />}
      {activeTab === "peaceOfMind" && <PeaceOfMindView />}
    </section>
  );
}
