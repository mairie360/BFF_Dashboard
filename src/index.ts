import 'dotenv/config';
import app from './app';

if (require.main === module) {
  const port = Number(process.env.PORT ?? 4007);
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}
