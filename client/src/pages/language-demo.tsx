/**
 * Language Demo Page
 * Showcases TrainPro's comprehensive multi-language capabilities
 */

import { LanguageSettingsDemo } from "@/components/LanguageSettingsDemo";
import { AnimatedPage } from "@/components/page-transition";

export function LanguageDemoPage() {
  return (
    <AnimatedPage>
      <LanguageSettingsDemo />
    </AnimatedPage>
  );
}