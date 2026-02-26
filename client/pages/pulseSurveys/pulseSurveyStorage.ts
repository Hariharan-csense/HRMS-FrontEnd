export const SURVEYS_KEY = "hrms.pulseSurveys.surveys";
export const RESPONSES_KEY = "hrms.pulseSurveys.responses";

export type StoredSurvey = {
  id: string;
  title: string;
  message: string;
  recipientType?: "all" | "department" | "designation" | "employee";
  recipientValue?: string;
  allowAnonymous?: boolean;
  createdAt: string;
};

export type StoredResponse = {
  surveyId: string;
  userId: string;
  score: number;
  label: string;
  comment: string;
  respondedAt: string;
  updatedAt?: string;
};

export const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getSurveys = (): StoredSurvey[] =>
  safeParse<StoredSurvey[]>(localStorage.getItem(SURVEYS_KEY), []);

export const getResponses = (): StoredResponse[] =>
  safeParse<StoredResponse[]>(localStorage.getItem(RESPONSES_KEY), []);

export const getResponsesForSurvey = (surveyId: string): StoredResponse[] =>
  getResponses().filter((r) => r.surveyId === surveyId);

