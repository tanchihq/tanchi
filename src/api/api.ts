/**
 * Root API wiring.
 *
 * Each module (mirroring a backend module) exports curried functions of the
 * form `(axios: AxiosInstance) => (data) => Promise<Result>`. Here we bind the
 * shared axios instance once and re-export ready-to-call `*Axios` functions
 * that components consume through `useAsync` / `useAsyncEvent`.
 *
 * Pattern (once a module exists):
 *
 *   import * as company from './company';
 *   const getCompanyAxios = company.getOneCompany(instances.axiosInstance);
 *   export { getCompanyAxios };
 */
import * as instances from './utils';

// Referenced so the import is retained until the first module is wired.
void instances;

export {};
