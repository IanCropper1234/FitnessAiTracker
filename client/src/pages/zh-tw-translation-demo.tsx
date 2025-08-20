/**
 * ZH-TW Translation Demo Page
 * Showcases the complete Traditional Chinese translation implementation
 */

import { ZhTwTranslationDemo } from "@/components/ZhTwTranslationDemo";
import { AnimatedPage } from "@/components/page-transition";

export function ZhTwTranslationDemoPage() {
  return (
    <AnimatedPage>
      <ZhTwTranslationDemo />
    </AnimatedPage>
  );
}