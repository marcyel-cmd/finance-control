import 'dotenv/config';
import { app } from './app';

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} \u2014 ${process.env.NODE_ENV || 'development'}`);
});
