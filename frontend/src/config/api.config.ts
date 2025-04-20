// const BASE_URL = "http://localhost:5000";
// //OR
// // const BASE_URL = `http://${process.env.EC2_PUBLIC_IP}`;

// export const API_ENDPOINTS = {
//   AUTH: BASE_URL,
//   VIDEO: `${BASE_URL}/videos-backend`,
//   WATCHLIST: `${BASE_URL}/watchlist-backend`,
// };

// WHILE TESTING LOCALLY, USE THE FOLLOWING CODE

const BASE_URL = "http://localhost";
export const API_ENDPOINTS = {
  AUTH: `${BASE_URL}:5000`,
  VIDEO: `${BASE_URL}:5001`,
  WATCHLIST: `${BASE_URL}:5002`,
};
