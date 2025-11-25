/**
 * Environnement global au projet
 */
const API_BASE = 'api/';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',
  tokenNameAccess: 'accessToken',
  maptilerKey: 'mwxgjLj2R8CaTqwOPibj',
  wsUrl: 'http://localhost:8000',
  api: {
    accounts: {
      login: `${API_BASE}accounts/login/`,
      register: `${API_BASE}accounts/register/`,
      logout: `${API_BASE}accounts/logout/`,
      token: `${API_BASE}accounts/token/`,
      check_password_change: `${API_BASE}accounts/check-password-change/`,
      email_exist: `${API_BASE}accounts/check-email/`,
      user_by_slug:`${API_BASE}accounts/user-by-slug`,
      default_password_change: `${API_BASE}accounts/default-password-change/`,
      forgot_password: `${API_BASE}accounts/forgot-password/`,
      token_verify:`${API_BASE}accounts/token-verify/`,
      user: {
        list: `${API_BASE}accounts/lists/`,
        get: `${API_BASE}accounts/get/`,
        get_fmap: `${API_BASE}accounts/get-fmap/`,
        create: `${API_BASE}auth/users/`,
        delete: `${API_BASE}accounts/delete/`,
        restore: `${API_BASE}accounts/restore/`,
        update: `${API_BASE}accounts/update/`,
        update_profile: `${API_BASE}accounts/update-profile/`,
      },
      admin: {
        create: `${API_BASE}auth/users/`,
      }
    },
    companies: {
      list: `${API_BASE}companies/list/`,
      get: `${API_BASE}companies/get/`,
      create: `${API_BASE}companies/create/`,
      delete: `${API_BASE}companies/delete/`,
      restore: `${API_BASE}companies/restore/`,
      update: `${API_BASE}companies/update/`,
      country_list : `${API_BASE}companies/countries/`,
      email_exist: `${API_BASE}companies/check-email/`,
      check_device_number: `${API_BASE}companies/check-device-number/`,
      add_image: `${API_BASE}companies/add-image/`,
      list_notification:`${API_BASE}companies/notification-list/`,
      update_device_fmap: `${API_BASE}companies/update-device-fmap/`,
    },
    devices: {
      list: `${API_BASE}devices/list/`,
      types: `${API_BASE}devices/types/`,
      servers: `${API_BASE}devices/servers/`,
      get: `${API_BASE}devices/get/`,
      create: `${API_BASE}devices/create/`,
      delete: `${API_BASE}devices/delete/`,
      update: `${API_BASE}devices/update/`,
      companies: `${API_BASE}devices/companies/`,
      location: `${API_BASE}devices/location/`,
      emei_exist: `${API_BASE}devices/check-imei/`,
      zone: `${API_BASE}devices/zone/`,
      get_companies: `${API_BASE}devices/companies/`,
      get_position: `${API_BASE}devices/get-position/`,
      get_devices_for_user: `${API_BASE}devices/get-device-user/`,
      speed_limit : `${API_BASE}devices/speed-limit/`,
      command: `${API_BASE}devices/command/`,
      intervetion_zone: `${API_BASE}devices/intervention-zone/`,
      restore : `${API_BASE}devices/restore/`,
    },
    map: {
      get_all:`${API_BASE}map/get-all/`, 
      create: `${API_BASE}map/create/`,
      delete: `${API_BASE}map/delete/`,
      get: `${API_BASE}map/get/`,
    },
    report: {
      list: `${API_BASE}report/list/`,
    }
  },
};
