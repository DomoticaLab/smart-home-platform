const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'domotica',
  password: 'postgres',
  port: 5433,
});

client.connect()
  .then(() => {
    console.log('CONECTADO OK');
    return client.end();
  })
  .catch(err => {
    console.error('ERROR:', err);
  });