import { FrameworkConfig } from "@/types/framework";
import { djangoConfig } from "./frameworks/django";
import { flaskConfig } from "./frameworks/flask";
import { nextjsConfig } from "./frameworks/nextjs";
import { expoConfig } from "./frameworks/expo";

export const frameworks: FrameworkConfig[] = [
  djangoConfig,
  flaskConfig,
  nextjsConfig,
  expoConfig,
  // Future frameworks will be added here
];

export const detectFramework = async (
  files: FileList
): Promise<FrameworkConfig | null> => {
  for (const framework of frameworks) {
    const isDetected = await framework.detector(files);
    if (isDetected) {
      return framework;
    }
  }
  return null;
};

export const getFrameworkByName = (name: string): FrameworkConfig | null => {
  return frameworks.find((f) => f.name === name) || null;
};
