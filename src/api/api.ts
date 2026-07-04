/**
 * Root API wiring.
 *
 * Chaque module (miroir d'un module back) exporte des fonctions curryfiées
 * `(axios) => (data) => Promise<Result>`. On lie ici l'instance axios partagée
 * et on réexporte des fonctions `*Axios` prêtes à l'emploi, consommées par les
 * composants via `useAsync` / `useAsyncEvent`.
 */
import * as instances from './utils';
import * as auth from './auth';
import * as onboarding from './onboarding';

// AUTH
const signInAxios = auth.signIn(instances.axiosInstance);
const getSessionAxios = auth.getSession(instances.axiosInstance);
const signOutAxios = auth.signOut(instances.axiosInstance);
const resendVerificationEmailAxios = auth.resendVerificationEmail(
  instances.axiosInstance,
);

// ONBOARDING
const signUpAxios = onboarding.signUp(instances.axiosInstance);
const getOnboardingStateAxios = onboarding.getOnboardingState(
  instances.axiosInstance,
);
const saveOnboardingProgressAxios = onboarding.saveOnboardingProgress(
  instances.axiosInstance,
);
const completeOnboardingAxios = onboarding.completeOnboarding(
  instances.axiosInstance,
);

export {
  signInAxios,
  getSessionAxios,
  signOutAxios,
  resendVerificationEmailAxios,
  signUpAxios,
  getOnboardingStateAxios,
  saveOnboardingProgressAxios,
  completeOnboardingAxios,
};
