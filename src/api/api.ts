import * as instances from './utils';
import * as auth from './auth';
import * as onboarding from './onboarding';
import * as prospects from './prospects';
import * as queue from './queue';
import * as senders from './senders';
import * as settings from './settings';
import * as learnings from './learnings';
import * as engine from './engine';
import * as activity from './activity';
import * as messages from './messages';
import * as suppression from './suppression';

const { axiosInstance } = instances;

const getSessionAxios = auth.getSession(axiosInstance);

const signUpAxios = onboarding.signUp(axiosInstance);
const getOnboardingStateAxios = onboarding.getOnboardingState(axiosInstance);
const saveOnboardingProgressAxios = onboarding.saveOnboardingProgress(axiosInstance);
const completeOnboardingAxios = onboarding.completeOnboarding(axiosInstance);
const generateOnboardingProfileAxios = onboarding.generateOnboardingProfile(axiosInstance);

const getManyProspectAxios = prospects.getManyProspect(axiosInstance);
const getOneProspectAxios = prospects.getOneProspect(axiosInstance);
const moveProspectStageAxios = prospects.moveProspectStage(axiosInstance);
const contactProspectAxios = prospects.contactProspect(axiosInstance);
const validateProspectAxios = prospects.validateProspect(axiosInstance);

const editQueueItemAxios = queue.editQueueItem(axiosInstance);

const getManySenderAxios = senders.getManySender(axiosInstance);
const createOneSenderAxios = senders.createOneSender(axiosInstance);
const deleteOneSenderAxios = senders.deleteOneSender(axiosInstance);
const testOneSenderAxios = senders.testOneSender(axiosInstance);

const getSettingsAxios = settings.getSettings(axiosInstance);
const updateSettingsAxios = settings.updateSettings(axiosInstance);
const generateSettingsProfileAxios = settings.generateProfile(axiosInstance);

const getLearningsAxios = learnings.getLearnings(axiosInstance);

const runEngineAxios = engine.runEngine(axiosInstance);

const getActivityStatusAxios = activity.getActivityStatus(axiosInstance);
const getActivityAxios = activity.getActivity(axiosInstance);

const getMessagesAxios = messages.getMessages(axiosInstance);

const importSuppressionAxios = suppression.importSuppression(axiosInstance);
const getSuppressionAxios = suppression.getSuppression(axiosInstance);

export {
  getSessionAxios,
  signUpAxios,
  getOnboardingStateAxios,
  saveOnboardingProgressAxios,
  completeOnboardingAxios,
  getManyProspectAxios,
  getOneProspectAxios,
  moveProspectStageAxios,
  contactProspectAxios,
  validateProspectAxios,
  editQueueItemAxios,
  getManySenderAxios,
  createOneSenderAxios,
  deleteOneSenderAxios,
  testOneSenderAxios,
  getSettingsAxios,
  updateSettingsAxios,
  generateSettingsProfileAxios,
  getLearningsAxios,
  runEngineAxios,
  generateOnboardingProfileAxios,
  getActivityStatusAxios,
  getActivityAxios,
  getMessagesAxios,
  importSuppressionAxios,
  getSuppressionAxios,
};
