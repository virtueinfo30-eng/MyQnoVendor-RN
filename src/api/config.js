export const API_CONFIG = {
  BASE_URL: 'https://myqno.com/qapp/',
  HEADERS: {
    AUTHORIZATION: 'Basic YW5kcm9pZF92aV82MDU6MUAzJCVWST09',
    HTTP_APP_NAME: 'android',
    HTTP_APP_TYPE: 'vendor', // Default for vendor app
    HTTP_APP_TYPE_USER: 'user',
    HTTP_APP_TYPE_VENDOR: 'vendor',
  },
  TIMEOUT: 60000,
};

export const ENDPOINTS = {
  LOGIN: 'api/login/loginuser', // with app_type params
  COUNTRIES: 'api/region/listcountries',
  STATES: 'api/region/liststates',
  CITIES: 'api/region/listcities',
  FORGOT_PASSWORD: 'api/login/forgotpassword',

  // Vendor Invoice
  VENDOR_INVOICE_LIST: 'api/vendorinvoice/listvendorinvoice', // /{company_master_id}
  ADD_INVOICE: 'api/vendorinvoice/addvendorinvoice',
  UPDATE_INVOICE: 'api/vendorinvoice/updatevendorinvoice', // /{vendor_invoice_id}
  GET_INVOICE: 'api/vendorinvoice/getvendorinvoice', // /{vendor_invoice_id}
  VIEW_INVOICE: 'api/vendorinvoice/getvendortnvoicedetails', // /{vendor_invoice_id}
  DELETE_INVOICE: 'api/vendorinvoice/delvendorinvoice',
  DOWNLOAD_INVOICE: 'api/vendorinvoice/download', // /{vendor_invoice_id}

  // Company
  FETCH_COMPANY_LOCATIONS: 'api/company/fetchcompanylocations', // {comp_id}/{mobile_no}
  GET_LOCATION_DETAILS: 'api/company/getlocationdetails', // {location_id}
  FETCH_USERS_IN_QUEUE: 'api/user/fetchallqueuetokens', // {user_token_id}
  FETCH_COMPANY_QUEUES: 'api/timeslot/fetchcompanyqueue', // {comp_id}/{loca_id}/{mobile_no}
  FETCH_QUEUE_DETAILS: 'api/timeslot/fetchtimings', // {que_mastr_id}
  SAVE_QUEUE_DETAILS: 'api/timeslot/save', // {company_id}
  FETCH_RG_NAMES: 'api/timeslot/ringgroupnamesforlocation', // {company_locations_id}
  FETCH_COMPANY_PROFILE: 'api/company/fetchcompany', // {comp_id}
  FETCH_AVAILABLE_BALANCE: 'api/wallet/availablebalance',
  FETCH_WALLET_INVOICES: 'api/wallet/fetchinvoice/0',
  FETCH_PACKAGES: 'api/wallet/fetchpackagelist',
  CREATE_INVOICE: 'api/wallet/createinvoice/{package_id}',
  PAYMENT_PAYU_MONEY_CONFIGURATION: 'api/wallet/getwayconfiguration',
  FETCH_CUSTOMERS: 'api/company/companycontacts', // {startpage}/{recordperpage}/{searchtext}
  VIEW_FEEDBACK: 'api/company/viewfeedback',
  FETCH_REPORTS: 'api/report/fetchtokensreport',
  FETCH_LOC_QUE_COMBO: 'api/company/getlocationqueuecombo',
  SEND_REPORT_EMAIL: 'api/report/sendreportinemail',
  CHANGE_PASSWORD: 'api/comcode/changepassword',
  UPDATE_COMPANY_PROFILE: 'api/company/save', // /{comp_id}
  COMPANY_CATEGORY: 'api/company/listcompanycategories/no',
  UPDATE_COMPANY_PROFILE_PIC: 'api/company/uploadcompanypic',

  // Active Queue
  ACTIVITY_GRID: 'api/activity/activitygrid',
  TERMINAL_SCREEN: 'api/activity/terminal',
  SWAP_TOKEN: 'api/activity/swaptokens', // {company_id}/{request_token_id}/{steps}
  GET_SWAP_TOKEN_NUMBER: 'api/activity/getswaptokennumber', // {company_id}/{request_token_id}
  SET_ARRIVED: 'api/activity/setarrievd', // {comp_id} (Note: typo matches native endpoint)
  SEND_NOTIFICATION: 'api/activity/sendnotification', // {company_id}
  REISSUE_TOKEN: 'api/activity/reissuetoken',
  ISSUE_MANUAL_TOKEN: 'api/queue/issuemanualtoken',
  GET_USER_BY_MOBILE: 'api/comcode/getuserfrommobile', // /{mobile_no}

  // Holidays
  FETCH_HOLIDAY_LIST: 'api/holiday/listholidays', // {queue_master_id}/{queue_holiday_id}
  ADD_HOLIDAY: 'api/holiday/add',
  UPDATE_HOLIDAY: 'api/holiday/update',
  DELETE_HOLIDAY: 'api/holiday/deleteHoliday',
  FETCH_HOLIDAY_QUEUE_LIST: 'api/timeslot/getcompanyqueuewithgrouping', // {company_master_id}/{company_locations_id}/{queue_master_id}

  // --- Ported User Account Endpoints ---
  REGISTER_USER: 'api/user/userregister',
  SEARCH_COMPANIES: 'api/region/showactivecompanies',
  FETCH_MY_TOKENS: 'api/user/fetchusertokens',
  FETCH_USER_PROFILE: 'api/user/fetchuser',
  UPDATE_USER_PROFILE: 'api/user/update',
  UPDATE_PROFILE_PIC: 'api/user/uploaduserpic',
  CHECK_DUPLICATE_MOBILE: 'api/comcode/ismobilenoduplicate',
  GENERATE_OTP: 'api/comcode/generateotpformobile',
  CONFIRM_OTP: 'api/comcode/otpconfirmed',
  WALLET_BALANCE: 'api/wallet/availablebalance',
  WALLET_INVOICES: 'api/wallet/fetchuserinvoice/0',
  PLACES_VISITED: 'api/company/alreadyvisited',
  SHOW_ACTIVE_QUEUES: 'api/region/showcompanyqueues',
  QUEUE_ME_IN: 'api/user/usequeuein',
  FETCH_SHARED_TOKENS: 'api/user/fetchsharedtokens',
  CANCEL_SHARED_TOKEN: 'api/user/cancelsharedtoken',
  FEEDBACK_USER: 'api/user/addfeedback',
  SHARE_USER_TOKEN: 'api/user/setsharedtoken',
  USER_CHANGE_PASSWORD: 'api/user/changepassword',
  CANCEL_TOKEN: 'api/user/updateusertoken', // {token_id}/{token_status}
  CANCEL_SHARED_TOKEN_URL: 'api/user/cancelsharedtoken', // {user_id}/{user_token_shared_id}
  IMPORT_CONTACTS: 'api/user/importcontacts', // {imported_by_user_id}
  LOCATION_LIST: 'api/region/listlocations', // {cid}
  UPDATE_USER_LAT_LONG: 'api/user/updatelatlong', // {user_id}
  REQUEST_DEMO: 'api/comcode/requestfordemo',
  GET_SUPPORT: 'api/comcode/getsupport',
  SEARCH_COMPANY: 'api/timeslot/activecompanies',
  SEARCH_QUEUE: 'api/timeslot/activequeues',
  REFER_TO_TOKEN: 'api/queue/refertotoken',
};
