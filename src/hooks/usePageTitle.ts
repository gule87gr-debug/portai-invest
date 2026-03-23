import { useEffect } from "react";

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = "PortAI — AI-Powered Investment Platform | Smart Investing with Artificial Intelligence";
    };
  }, [title]);
};
