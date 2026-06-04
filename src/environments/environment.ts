export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  signalrUrl: 'http://localhost:5000',
  // apiUrl: 'https://lmsplatform.runasp.net/api',
  // signalrUrl: 'https://lmsplatform.runasp.net',

  //to run the API project, use the command:
  //dotnet run --project LMS.API --urls "http://localhost:5000" 

  //to run the Angular project, use the command:
  // ng serve -o

  // Publishable keys are public by design (safe in the client). Not strictly needed for the
  // server-side redirect Checkout flow, but set for consistency / future Stripe.js use.
  stripePublishableKey: 'pk_test_51OnIQZG3C5uEFs6dT5zG1D0P2nDbDIeIhquy3Cn9CX2vt2eZyhtJTQacXqWgKb0ruGImYv44YZuyjvkCKZoG6JUB00sZ2h2QBI',
  appName: 'LMS Platform',
  defaultLang: 'ar',
};
