const ENV = {
    dev: {
      apiUrl: 'http://213.109.146.93:5000',
    },
    prod: {
      apiUrl: 'http://213.109.146.93:5000',
    },
  };
  
  const getEnvVars = () => (__DEV__ ? ENV.dev : ENV.prod);
  
  export default getEnvVars;