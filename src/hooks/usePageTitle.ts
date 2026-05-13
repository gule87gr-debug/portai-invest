import { useEffect } from "react";

const DEFAULT_TITLE = "PortAI — AI Bias Checker & Portfolio Tracker";

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
};
