
// includes
import * as process from 'process';
import * as express from 'express';
import { WelcomeController } from './lib/WelcomeController';

// define express
const app: express.Application = express();
app.use('/welcome', WelcomeController);

// listen
const port: number = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    // Success callback
    console.log(`Listening at http://localhost:${port}/`);
});
