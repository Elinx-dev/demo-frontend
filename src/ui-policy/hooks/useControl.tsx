import React from "react";
import { SecureStorage } from "@/services/storage";

let controlSet: Set<number> | null = null;

const getControls = (): Set<number> => {
  if (controlSet) return controlSet;

  try {
    const raw = SecureStorage.get<number[]>("auth.control");
    controlSet = new Set(raw || []);
  } catch {
    controlSet = new Set();
  }

  return controlSet;
};


export const resetControls = () => {
  controlSet = null;
};

export const useControl = (id: number): boolean => {
  return getControls().has(id);
};


type ControlProps = {
  id: number;
  children: React.ReactNode;
};

export const Control = ({ id, children }: ControlProps) => {
  const allowed = useControl(id);

  if (!allowed) return null;

  return <>{children}</>;
};
