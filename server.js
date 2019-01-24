'use strict';

const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    let uri;

    if ((req.url = '/')) {
      uri = '/index.html';
    } else {
      uri = req.url;
    }

    fs.readFile('./public' + uri, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404);
          fs.readFile('./public/404.html', 'utf8', (err, data) => {
            if (err) {
              throw err;
            } else {
              res.end(data);
            }
          });
        } else {
          throw err;
        }
      } else {
        res.end(data);
      }
    });
  }

  if (req.method === 'POST') {
    if (req.url !== '/elements') {
      res.writeHead(404);
      return res.end('Could not post to file path: ' + req.url);
    } else {
      let requestBody = '';
      let parsedRequestBody = '';
      let htmlFileText = '';
      let indexHTMLText = '';

      req.on('data', chunk => {
        requestBody += chunk;
      });

      req.on('end', chunk => {
        if (chunk) {
          requestBody += chunk;
        }

        parsedRequestBody = querystring.parse(requestBody);

        htmlFileText = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>The Elements - Helium</title>
            <link rel="stylesheet" href="/css/styles.css" />
          </head>
          <body>
            <h1>${parsedRequestBody.elementName}</h1>
            <h2>${parsedRequestBody.elementSymbol}</h2>
            <h3>Atomic number ${parsedRequestBody.elementAtomicNumber}</h3>
            <p>
              ${parsedRequestBody.elementDescription}
            </p>
            <p><a href="/">back</a></p>
          </body>
        </html>
        `;

        fs.writeFile(
          `./public/${parsedRequestBody.elementName}.html`,
          htmlFileText,
          (err, data) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/JSON' });
              res.end('{ "success": false }');
            }
          }
        );

        fs.readFile('./public/index.html', 'utf8', (err, data) => {
          if (err) {
            throw err;
          } else {
            indexHTMLText = data;

            processData();
          }
        });

        function processData() {
          const indexOfListEnd = indexHTMLText.indexOf('</ol>');
          const indexHTMLTop = indexHTMLText.slice(0, indexOfListEnd);
          const indexHTMLBottom = indexHTMLText.slice(indexOfListEnd);
          const newListElement = `<li><a href="/${
            parsedRequestBody.elementName
          }">${parsedRequestBody.elementName}</a><li>`;
          const newIndexHTML = indexHTMLTop.concat(
            newListElement,
            indexHTMLBottom
          );

          fs.writeFile('./public/index.html', newIndexHTML, (err, data) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/JSON' });
              res.end('{ "success": false }');
            } else {
              res.writeHead(200, { 'Content-Type': 'application/JSON' });
              res.end('{ "success": true }');
            }
          });
        }
      });
    }
  }
});

server.listen(PORT, () => {
  console.log(`The server is running on PORT: ${PORT}`);
});
