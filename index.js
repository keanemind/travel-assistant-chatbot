/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the 
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const 
  FBMessenger = require('fb-messenger'),
  messenger = new FBMessenger({token: '<facebook-page-access-token>'}),
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  readline = require('readline-sync'),
  app = express().use(body_parser.json()), // creates express http server
  access_token = '<facebook-page-access-token>'; // TODO

let human = false;

// You can find your project ID in your Dialogflow agent settings
const projectId = '<dialogflow-project-id>'; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
const languageCode = 'en-US';

// Instantiate a DialogFlow client.
const dialogflow = require('dialogflow');
const sessionClient = new dialogflow.SessionsClient({keyFilename: '<dialogflow-auth-file>.json'});

// Define session path
const sessionPath = sessionClient.sessionPath(projectId, sessionId);

// Sets server port and logs message on success
app.listen(8000, 'localhost', () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    let psid;
    let our_id;
    let webhook_event;

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      webhook_event = entry.messaging[0];
      our_id = entry.id;
      psid = webhook_event.sender.id;
      console.log(webhook_event);

    });

    // Query dialogflow with the user's message
    let query = webhook_event.message.text;

    // The text query request.
    let df_request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: query,
          languageCode: languageCode,
        },
      },
    };
  
    // Send request and log result
    sessionClient
    .detectIntent(df_request)
    .then(responses => {
        console.log('Detected intent');
        let result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);
        if (result.intent) {
          if (result.intent.displayName == 'Default Fallback Intent') {
            human = true;
          }
          console.log(`  Intent: ${result.intent.displayName}`);
        } else {
          console.log(`  No intent matched.`);
        }

        let response_text;
        if (human) {
          response_text = readline.question('Response: ');
        } else {
          response_text = result.fulfillmentText;
        }

        messenger.sendTextMessage({id: psid, text: response_text});
    
        /*
        let ms_request = {
          messaging_type: 'RESPONSE',
          recipient: {
            id: psid
          },
          message: {
            text: response_text
          }
        };
    
        request.post(
          `https://graph.facebook.com/v2.6/me/messages?access_token=${access_token}`,
          { json: ms_request },
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
            } else {
              console.log("Error posting: " + error + "\n" + response + "\n" + body + "\n");
            }
          }
        )*/

        /*
          let request_body = {
            "recipient": {
                "id": sender_psid
            },
            "message": response
        };
        console.log(request_body);
        // Send the HTTP request to the Messenger Platform
        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": {"access_token": access_token},
            "method": "POST",
            "json": request_body
        }, (err, res, body) => {
            if (!err) {
                console.log('message sent!')
            } else {
                console.error("Unable to send message:" + err);
            }
        });*/

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    })
    .catch(err => {
        console.error('ERROR:', err);
    });

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  // make sure this is configured on your facebook developer settings
  const VERIFY_TOKEN = "<random-characters-of-your-choice>";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

app.get('/', (req, res) => {
  res.status(200).send('');
})
