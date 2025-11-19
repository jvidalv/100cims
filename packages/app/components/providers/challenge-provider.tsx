import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

interface ChallengeContextType {
  challengeId: string;
  setChallengeId: (challengeId: string) => void;
}

const STORAGE_KEY = "100cims::challenge";

export const getLocalChallenge = () => AsyncStorage.getItem(STORAGE_KEY);
export const setLocalChallenge = (challengeId: string) =>
  AsyncStorage.setItem(STORAGE_KEY, challengeId);

const ChallengeContext = createContext<ChallengeContextType | undefined>(
  undefined,
);

export const ChallengeProvider: FC<
  PropsWithChildren<{ challengeId: string }>
> = ({ children, challengeId: propChallengeId }) => {
  const [challengeId, setChallengeId] = useState<string>(propChallengeId);

  const setChallenge = async (challengeId: string) => {
    setChallengeId(challengeId);
    void setLocalChallenge(challengeId);
  };

  return (
    <ChallengeContext.Provider
      value={{
        challengeId,
        setChallengeId: setChallenge,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
};

export const useChallenge = (): ChallengeContextType => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error("useChallenge must be used within an ChallengeProvider");
  }
  return context;
};
