export function prepareToDie(callback: NodeJS.ExitListener) {
  const terminate: NodeJS.SignalsListener = () => process.exit(0);

  if (process.env.NODE_ENV === 'development') process.once('SIGINT', terminate);

  process
  .on('SIGTERM', terminate)
  .on('exit', callback);
}
