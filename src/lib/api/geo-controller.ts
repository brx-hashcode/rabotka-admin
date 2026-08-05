import { AdminBaseController } from "./base-controller";

export type Country = { code: string; name: string };

/**
 * The country/city reference list, served by our own API from a dataset that
 * ships with the image — never a third-party lookup from the browser.
 *
 * The endpoints are public (onboarding uses them before there is a session),
 * which is why nothing here needs admin auth.
 */
class GeoController extends AdminBaseController {
  getCountries(): Promise<Country[]> {
    return this.get<Country[]>("/public/geo/countries");
  }

  getCities(countryCode: string): Promise<string[]> {
    return this.get<string[]>(
      `/public/geo/countries/${encodeURIComponent(countryCode)}/cities`,
    );
  }
}

const controller = new GeoController();

export const getCountries: () => Promise<Country[]> =
  controller.getCountries.bind(controller);
export const getCities: (countryCode: string) => Promise<string[]> =
  controller.getCities.bind(controller);
